const fsPromises = require("fs").promises; // Use promises for async/await
const fs = require("fs"); // Import the synchronous fs module
const path = require("path");
const ignore = require("ignore");

const mediaExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".bmp",
  ".mp3",
  ".wav",
  ".flac",
  ".ogg",
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".pdf",
  ".zip",
  ".rar",
  ".tar",
  ".gz",
]);

const processFolder = async (folderPath) => {
  // Make this an async function
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    console.warn(`⚠️ Skipping invalid folder: ${folderPath}`);
    return;
  }

  console.log(`📂 Processing: ${folderPath}`);
  const gitignoreFile = path.join(folderPath, ".gitignore");
  const outputFile = path.join(folderPath, "output.txt");

  let ig = ignore();
  ig.add("package-lock.json");

  try {
    if (fs.existsSync(gitignoreFile)) {
      const gitignoreContent = await fsPromises.readFile(gitignoreFile, "utf8"); // Use await
      ig = ignore().add(gitignoreContent);
    }
  } catch (err) {
    console.error(`❌ Error reading .gitignore in ${folderPath}:`, err);
    return; // Stop processing this folder on error
  }

  try {
    const files = await fsPromises.readdir(folderPath); // Use await
    let combinedContent = "";
    let fileCount = 0;

    for (const file of files) {
      // Use a for...of loop for async
      const filePath = path.join(folderPath, file);
      const ext = path.extname(file).toLowerCase();

      if (ig.ignores(file) || mediaExtensions.has(ext)) {
        console.log(`🚫 Skipping: ${file}`);
        continue;
      }

      try {
        const stats = await fsPromises.stat(filePath); // Use await

        if (stats.isFile()) {
          const content = await fsPromises.readFile(filePath, "utf8"); // Use await
          combinedContent += `\n--- ${file} ---\n${content}\n`;
          fileCount++;
        }
      } catch (err) {
        console.error(`❌ Error processing file ${filePath}:`, err);
      }
    }

    if (fileCount > 0) {
      await fsPromises.writeFile(outputFile, combinedContent); // Use await
      console.log(`✅ Merged ${fileCount} files into ${outputFile}`);
    } else {
      console.log(`⚠️ No valid files found in ${folderPath}`);
    }
  } catch (err) {
    console.error(`❌ Error reading directory ${folderPath}:`, err);
  }
};

const main = async () => {
  // Wrap the main logic in an async function
  const folders = [
    "/Users/pedroalmeida/Documents/Projects/StickerSmash", // Replace with your actual paths
    // Add more folder paths here as needed
  ];

  if (folders.length === 0) {
    console.log("⚠️ No folders to process.");
    process.exit(1);
  }

  console.log(`🔄 Processing ${folders.length} folders...`);
  for (const folder of folders) {
    // Use a for...of loop for async
    await processFolder(folder);
  }
  console.log("✅ Done!"); // Add a completion message
};

main().catch((err) => {
  // Catch any top-level errors
  console.error("❌ An error occurred:", err);
  process.exit(1);
});
