# Define the Expo project directory
$projectDirectory = "C:\Users\zsoka\OneDrive\Asztali gép\Running2\RunningApp"

# Change to project directory
Set-Location -Path $projectDirectory

# Run Expo prebuild to generate native Android project
Write-Host "Prebuilding the Expo project..."
expo prebuild

# Install dependencies
Write-Host "Installing dependencies..."
npm install

# Navigate to the Android directory
Set-Location -Path ".\android"

# Build the APK
Write-Host "Building the APK..."
.\gradlew assembleRelease

# Display the APK location
Write-Host "APK build complete! Find it at: android\app\build\outputs\apk\release\app-release.apk"
