const fsPromises = require("fs").promises;
const fs = require("fs");
const path = require("path");
const ignore = require("ignore");

// Import config.json directly
const config = require("./config.json"); // Adjust path if needed

const processFolder = async (folderPath, ig, considerGitignore) => {
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    console.warn(`⚠️ Skipping invalid folder: ${folderPath}`);
    return "";
  }

  console.log(`📂 Processing: ${folderPath}`);
  const gitignoreFile = path.join(folderPath, ".gitignore");

  if (considerGitignore) {
    // Conditionally read .gitignore
    try {
      if (fs.existsSync(gitignoreFile)) {
        const gitignoreContent = await fsPromises.readFile(
          gitignoreFile,
          "utf8"
        );
        ig.add(gitignoreContent);
      }
    } catch (err) {
      console.error(`❌ Error reading .gitignore in ${folderPath}:`, err);
      return "";
    }
  } else {
    console.log(`🚫 Ignoring .gitignore in ${folderPath}`);
  }

  let combinedContent = "";
  try {
    const files = await fsPromises.readdir(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);

      if (config.ignoreFiles.includes(file)) {
        // Check ignoreFiles
        console.log(`🚫 Skipping file (ignoreFiles): ${file}`);
        continue;
      }

      const ext = path.extname(file).toLowerCase();

      if (ig.ignores(file) || config.ignoreExtensions.includes(ext)) {
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
  try {
    if (
      !config ||
      !config.folders ||
      !Array.isArray(config.folders) ||
      !config.output ||
      !config.ignoreExtensions ||
      !Array.isArray(config.ignoreExtensions) ||
      !config.ignoreFiles ||
      !Array.isArray(config.ignoreFiles) ||
      typeof config.considerGitignore !== "boolean" // Check considerGitignore
    ) {
      console.error(
        "❌ Invalid configuration file format. Expected { folders: [...], output: '...', ignoreExtensions: [...], ignoreFiles: [...], considerGitignore: boolean }"
      );
      process.exit(1);
    }

    const folders = config.folders;
    const outputFile = config.output;
    const considerGitignore = config.considerGitignore; // Get the considerGitignore value

    try {
      await fsPromises.access(path.dirname(outputFile), fs.constants.W_OK);
    } catch (accessError) {
      console.error(
        `❌ Output directory is not writable: ${path.dirname(outputFile)}`,
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
        considerGitignore
      ); //Pass value
      if (folderContent) {
        overallContent += folderContent;
      }
    }

    await fsPromises.writeFile(outputFile, overallContent);
    console.log(`✅ Merged content from all folders into ${outputFile}`);
  } catch (err) {
    console.error("❌ Error reading or processing:", err);
    process.exit(1);
  }
};

main().catch((err) => {
  console.error("❌ An error occurred:", err);
  process.exit(1);
});
