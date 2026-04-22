require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "BeaconMeshSDK"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/beaconmesh/beaconmesh-react-native.git", :tag => "#{s.version}" }

  # Include ALL native sources
  s.source_files = "ios/**/*.{h,m,mm,swift}"

  # TurboModule needs ObjC++
  # s.requires_arc = true

  # Swift support
  s.swift_version = "5.0"

  # Important for Swift + static libs
  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
  }

  install_modules_dependencies(s)
end
