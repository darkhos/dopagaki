// Audit only: OCR every image in a folder with Apple Vision (ko/ja/en) and print one JSON line per file.
// Usage: swift audit/ocr/ocr.swift <imageDir> > out.jsonl
import Foundation
import Vision
import AppKit

let dir = CommandLine.arguments[1]
let scale = CommandLine.arguments.count > 2 ? Double(CommandLine.arguments[2]) ?? 1 : 1
let only: Set<String>? = CommandLine.arguments.count > 3 ? Set(CommandLine.arguments[3].split(separator: ",").map(String.init)) : nil
let files = ((try? FileManager.default.contentsOfDirectory(atPath: dir))?.filter { $0.hasSuffix(".jpg") || $0.hasSuffix(".png") || $0.hasSuffix(".webp") }.sorted() ?? []).filter { only == nil || only!.contains($0) }
for f in files {
  autoreleasepool {
    let url = URL(fileURLWithPath: dir).appendingPathComponent(f)
    guard let img = NSImage(contentsOf: url), let cg0 = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
      print("{\"file\":\"\(f)\",\"error\":\"load\"}"); return
    }
    var cg = cg0
    if scale != 1, let ctx = CGContext(data: nil, width: Int(Double(cg0.width) * scale), height: Int(Double(cg0.height) * scale), bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) {
      ctx.interpolationQuality = .high
      ctx.draw(cg0, in: CGRect(x: 0, y: 0, width: ctx.width, height: ctx.height))
      if let up = ctx.makeImage() { cg = up }
    }
    let req = VNRecognizeTextRequest()
    req.minimumTextHeight = 0
    req.recognitionLevel = .accurate
    req.recognitionLanguages = ["ko-KR", "ja-JP", "en-US"]
    req.usesLanguageCorrection = false
    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    try? handler.perform([req])
    let lines = (req.results ?? []).compactMap { $0.topCandidates(1).first?.string }
    let obj: [String: Any] = ["file": f, "w": cg.width, "h": cg.height, "text": lines.joined(separator: "\n")]
    if let data = try? JSONSerialization.data(withJSONObject: obj), let s = String(data: data, encoding: .utf8) { print(s) }
    fflush(stdout)
  }
}
