const fsPromises = require("fs").promises;
const fs = require("fs");
const path = require("path");
const ignore = require("ignore");

// Import config.json directly
const config = require("./config.json"); // Adjust path if needed

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

const processFolder = async (folderPath, ig, outputFile) => {
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    console.warn(`⚠️ Skipping invalid folder: ${folderPath}`);
    return "";
  }

  console.log(`📂 Processing: ${folderPath}`);
  const gitignoreFile = path.join(folderPath, ".gitignore");

  try {
    if (fs.existsSync(gitignoreFile)) {
      const gitignoreContent = await fsPromises.readFile(gitignoreFile, "utf8");
      ig.add(gitignoreContent);
    }
  } catch (err) {
    console.error(`❌ Error reading .gitignore in ${folderPath}:`, err);
    return "";
  }

  let combinedContent = "";
  try {
    const files = await fsPromises.readdir(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const ext = path.extname(file).toLowerCase();

      if (ig.ignores(file) || mediaExtensions.has(ext)) {
        console.log(`🚫 Skipping: ${file}`);
        continue;
      }

      try {
        const stats = await fsPromises.stat(filePath);
        if (stats.isFile()) {
          const content = await fsPromises.readFile(filePath, "utf8");
          combinedContent += `\n--- ${filePath} ---\n${content}\n`;
        }
      } catch (err) {
        console.error(`❌ Error processing file ${filePath}:`, err);
      }
    }
  } catch (err) {
    console.error(`❌ Error reading directory ${folderPath}:`, err);
    return "";
  }

  return combinedContent;
};

const main = async () => {
  const hardcodedOutputFile =
    "/Users/pedroalmeida/Documents/Projects/concatenate-repo/output.txt";

  try {
    if (!config || !config.folders || !Array.isArray(config.folders)) {
      console.error(
        "❌ Invalid configuration file format. Expected { folders: [...] }"
      );
      process.exit(1);
    }

    const folders = config.folders;

    try {
      await fsPromises.access(
        path.dirname(hardcodedOutputFile),
        fs.constants.W_OK
      );
    } catch (accessError) {
      console.error(
        `❌ Output directory is not writable: ${path.dirname(
          hardcodedOutputFile
        )}`,
        accessError
      );
      process.exit(1);
    }

    if (folders.length === 0) {
      console.log("⚠️ No folders to process.");
      process.exit(1);
    }

    let overallContent = "";
    const ig = ignore();

    console.log(`🔄 Processing ${folders.length} folders...`);
    for (const folderPath of folders) {
      const folderContent = await processFolder(
        folderPath,
        ig,
        hardcodedOutputFile
      );
      if (folderContent) {
        overallContent += folderContent;
      }
    }

    await fsPromises.writeFile(hardcodedOutputFile, overallContent);
    console.log(
      `✅ Merged content from all folders into ${hardcodedOutputFile}`
    );
  } catch (err) {
    console.error("❌ Error reading or processing:", err);
    process.exit(1);
  }
};

main().catch((err) => {
  console.error("❌ An error occurred:", err);
  process.exit(1);
});
