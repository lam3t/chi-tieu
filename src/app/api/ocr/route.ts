import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";
import { OCRResultSchema } from "@/types/ocr";
import { DEFAULT_CATEGORIES } from "@/lib/constants";

// Simple in-memory rate limiter (sliding window: 20 requests per minute per user)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  // 1. Auth required
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập để sử dụng tính năng nhận diện hóa đơn AI" },
      { status: 401 }
    );
  }

  const userId = session.user.id || session.user.email || "anonymous";

  // 2. Rate limiting check
  if (!checkRateLimit(userId)) {
    return NextResponse.json(
      { error: "Bạn đã thao tác quá nhiều lần trong 1 phút. Vui lòng đợi trong giây lát." },
      { status: 429 }
    );
  }

  try {
    // 3. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userCategoriesJson = formData.get("categories") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Không tìm thấy file ảnh đính kèm" },
        { status: 400 }
      );
    }

    // Check file size (limit 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Kích thước ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn." },
        { status: 400 }
      );
    }

    // Check file type
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Định dạng file không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG hoặc WEBP." },
        { status: 400 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const mediaType = (file.type as "image/jpeg" | "image/png" | "image/webp") || "image/jpeg";

    // 4. Initialize Anthropic client
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Hệ thống chưa cấu hình ANTHROPIC_API_KEY trong file môi trường (.env.local). Bạn có thể nhập tay thông tin.",
        },
        { status: 503 }
      );
    }

    const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
    const anthropic = new Anthropic({ apiKey });

    // Available categories list for the prompt
    let categoryList = DEFAULT_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      group: c.group,
      type: c.type,
    }));

    if (userCategoriesJson) {
      try {
        const parsed = JSON.parse(userCategoriesJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          categoryList = parsed;
        }
      } catch {
        // fallback to default categories
      }
    }

    const promptText = `Bạn là hệ thống OCR bóc tách dữ liệu hóa đơn, biên lai thanh toán và ảnh chụp màn hình ứng dụng ngân hàng (Vietcombank, MoMo, Techcombank, MBBank, ZaloPay, BIDV, VPBank, Grab, v.v.) tại Việt Nam.

Hãy phân tích ảnh và trích xuất thông tin tài chính thành DUY NHẤT một chuỗi JSON hợp lệ với cấu trúc sau:
{
  "amount": <số nguyên VND, lớn hơn 0, ví dụ: 50000 hoặc 1250000. Xử lý đúng định dạng như 1.250.000đ, 50k -> 50000, 1tr2 -> 1200000>,
  "currency": "VND",
  "date": <chuỗi ngày ISO định dạng "YYYY-MM-DD" hoặc null nếu không tìm thấy trên ảnh>,
  "merchant": <tên người nhận/cửa hàng/dịch vụ/nơi chuyển tiền, ví dụ: "Grab", "Highlands Coffee", "Cơm Tấm Ba Ghiền", "Nguyễn Văn A">,
  "type": <"expense" nếu là thanh toán/chuyển tiền/chi tiêu, hoặc "income" nếu là nhận tiền chuyển khoản/tiền về>,
  "categoryGuess": <id của một trong các danh mục sau phù hợp nhất: ${categoryList.map((c) => `"${c.id}" (${c.name})`).join(", ")}>,
  "confidence": <độ tin cậy từ 0.0 đến 1.0>,
  "rawText": <tóm tắt ngắn gọn 1-2 câu nội dung chính nhìn thấy>
}

Quy tắc bắt buộc:
1. Chỉ trả về chuỗi JSON thuần túy. KHÔNG kèm bất kỳ văn bản giải thích, KHÔNG có thẻ markdown \`\`\`json.
2. Số tiền phải là số nguyên dương VND không có dấu chấm/phẩy trong giá trị số (ví dụ: 125000 chứ không phải "125.000").`;

    const response = await anthropic.messages.create({
      model,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: promptText,
            },
          ],
        },
      ],
    });

    const responseBlock = response.content[0];
    if (!responseBlock || responseBlock.type !== "text") {
      throw new Error("Phản hồi từ AI không hợp lệ");
    }

    let jsonText = responseBlock.text.trim();
    // Clean markdown code blocks if model wrapped them
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const rawParsed = JSON.parse(jsonText);
    const validated = OCRResultSchema.parse(rawParsed);

    return NextResponse.json({
      success: true,
      data: validated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[OCR API] Parsing failed:", message);
    return NextResponse.json(
      {
        error: "Không thể nhận diện hóa đơn tự động. Bạn có thể nhập tay thông tin.",
        details: message,
      },
      { status: 422 }
    );
  }
}
