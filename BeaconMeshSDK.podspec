require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "BeaconMeshSDK"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "13.0" }

  s.source       = {
    :git => "https://github.com/bridgefy/bridgefy-scanner-react-native.git",
    :tag => s.version.to_s
  }

  s.static_framework = true
  s.swift_version = "5.9"

  #
  # RN bridge files
  #
  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.public_header_files = "ios/**/*.h"

  #
  # XCFRAMEWORK
  #
  s.vendored_frameworks = "ios/Framework/BeaconMesh.xcframework"

  #
  # DOWNLOAD XCFRAMEWORK
  #
  s.prepare_command = <<-CMD
    rm -rf ios/Framework
    mkdir -p ios/Framework

    curl -L \
      https://github.com/FranciscoMkdir/BeaconMeshSDK-iOS-binary/releases/download/1.0.4/BeaconMeshFramework.xcframework.zip \
      -o ios/Framework/BeaconMeshFramework.xcframework.zip

    cd ios/Framework

    unzip -o BeaconMeshFramework.xcframework.zip

    rm BeaconMeshFramework.xcframework.zip
  CMD

  #
  # Binary dependencies
  #
  s.dependency "BridgefySDK"
  s.dependency "AWSCore"
  s.dependency "AWSLogs"

  #
  # React Native dependencies
  #
  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end
end
