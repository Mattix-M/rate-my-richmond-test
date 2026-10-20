// Local macOS Vision OCR. Input: JSON jobs [{id,path}], output: JSONL observations.
// Compile: swiftc -module-cache-path /tmp/room-swift-cache recognize_plan_text.swift -o /tmp/room-ocr-batch
import Foundation
import Vision
import AppKit
struct Job: Decodable { let id: String; let path: String }
let jobs = try JSONDecoder().decode([Job].self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1])))
for job in jobs {
 autoreleasepool {
  do {
   guard let image=NSImage(contentsOfFile:job.path) else { throw NSError(domain:"image",code:1) }
   var rect=CGRect(origin:.zero,size:image.size)
   guard let cg=image.cgImage(forProposedRect:&rect,context:nil,hints:nil) else { throw NSError(domain:"image",code:2) }
   let request=VNRecognizeTextRequest();request.recognitionLevel = .accurate
   request.usesLanguageCorrection=false;request.minimumTextHeight=0.001
   try VNImageRequestHandler(cgImage:cg).perform([request])
   var words:[[String:Any]]=[]
   for observation in request.results ?? [] {
    guard let candidate=observation.topCandidates(1).first else {continue}
    let text=candidate.string
    let regex=try NSRegularExpression(pattern:"[A-Za-z]*[0-9]+[A-Za-z]*|\\b[A-D]\\b")
    for match in regex.matches(in:text,range:NSRange(text.startIndex...,in:text)) {
     guard let range=Range(match.range,in:text),let box=try candidate.boundingBox(for:range) else {continue}
     words.append(["text":String(text[range]),"line":text,"confidence":candidate.confidence,
       "x0":box.boundingBox.minX,"y0":1-box.boundingBox.maxY,"x1":box.boundingBox.maxX,"y1":1-box.boundingBox.minY])
    }
   }
   let output:[String:Any]=["id":job.id,"words":words]
   let data=try JSONSerialization.data(withJSONObject:output,options:[.sortedKeys])
   print(String(data:data,encoding:.utf8)!);fflush(stdout)
  } catch { print("{\"id\":\"\(job.id)\",\"error\":\"OCR failed\"}");fflush(stdout) }
 }
}
