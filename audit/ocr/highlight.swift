// Audit only: find the pink highlight box drawn on a proof screenshot, OCR inside it at 3x.
// Usage: highlight <imageDir> <comma-separated files>  -> JSON lines {file, box:[x,y,w,h]|null, text}
import Foundation
import Vision
import AppKit

let dir = CommandLine.arguments[1]
let files = CommandLine.arguments[2].split(separator: ",").map(String.init)

func isPink(_ r: Int, _ g: Int, _ b: Int) -> Bool { r > 140 && g < 115 && b > 80 && r - g > 70 }

for f in files {
  autoreleasepool {
    let url = URL(fileURLWithPath: dir).appendingPathComponent(f)
    guard let img = NSImage(contentsOf: url), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { print("{\"file\":\"\(f)\",\"box\":null,\"text\":\"\"}"); return }
    let w = cg.width, h = cg.height
    guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return }
    ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
    let px = ctx.data!.bindMemory(to: UInt8.self, capacity: w * h * 4)
    // rows (top-origin) with a long horizontal run of pink = box edges
    var edgeRows: [(y: Int, x0: Int, x1: Int)] = []
    for yb in 0..<h {
      var run = 0, best = 0, bestEnd = 0
      for x in 0..<w {
        let i = (yb * w + x) * 4
        if isPink(Int(px[i]), Int(px[i+1]), Int(px[i+2])) { run += 1; if run > best { best = run; bestEnd = x } } else { run = 0 }
      }
      if best > 120 { edgeRows.append((yb, bestEnd - best + 1, bestEnd)) }
    }
    var box: [Int]? = nil
    if edgeRows.count >= 2 {
      let ys = edgeRows.map { $0.y }.sorted()
      // pick the widest-spanning pair of edges at least 18px apart
      let top = ys.first!, bottom = ys.last!
      if bottom - top >= 18 {
        let x0 = edgeRows.map { $0.x0 }.min()!, x1 = edgeRows.map { $0.x1 }.max()!
        box = [x0, top, x1 - x0 + 1, bottom - top + 1]
      }
    }
    var text = ""
    if let b = box {
      // include a margin below the box: prices are often on the next line
      let pad = 6
      let rect = CGRect(x: max(0, b[0] - pad), y: max(0, b[1] - pad), width: min(w - max(0, b[0] - pad), b[2] + 2 * pad), height: min(h - max(0, b[1] - pad), b[3] + 90))
      if let crop = cg.cropping(to: rect) {
        let s = 3
        if let c2 = CGContext(data: nil, width: crop.width * s, height: crop.height * s, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) {
          c2.interpolationQuality = .high
          c2.draw(crop, in: CGRect(x: 0, y: 0, width: c2.width, height: c2.height))
          if let up = c2.makeImage() {
            let req = VNRecognizeTextRequest(); req.recognitionLevel = .accurate; req.recognitionLanguages = ["ko-KR", "ja-JP", "en-US"]; req.usesLanguageCorrection = false
            try? VNImageRequestHandler(cgImage: up, options: [:]).perform([req])
            text = (req.results ?? []).compactMap { $0.topCandidates(1).first?.string }.joined(separator: " / ")
          }
        }
      }
    }
    let obj: [String: Any] = ["file": f, "box": box as Any, "text": text]
    if let d = try? JSONSerialization.data(withJSONObject: obj), let s = String(data: d, encoding: .utf8) { print(s) }
    fflush(stdout)
  }
}
