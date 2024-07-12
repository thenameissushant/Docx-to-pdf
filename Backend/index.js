const express = require("express");
const multer = require("multer");
const cors = require("cors");
const docxToPDF = require("docx-pdf");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

app.use(cors());

// Ensure upload and files directories exist
const uploadDir = path.join(__dirname, "uploads");
const filesDir = path.join(__dirname, "files");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
}

// Setting up file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

app.post("/convertFile", upload.single("file"), (req, res, next) => {
    try {
        if (!req.file) {
            console.log("No file uploaded");
            return res.status(400).json({
                message: "No file uploaded",
            });
        }

        // Defining output file path
        const outputPath = path.join(filesDir, `${path.parse(req.file.originalname).name}.pdf`);
        
        console.log(`Converting file: ${req.file.path} to ${outputPath}`);

        docxToPDF(req.file.path, outputPath, (err, result) => {
            if (err) {
                console.log("Error during conversion:", err);
                return res.status(500).json({
                    message: "Error converting docx to pdf",
                });
            }

            res.download(outputPath, (err) => {
                if (err) {
                    console.log("Error during file download:", err);
                    return res.status(500).json({
                        message: "Error during file download",
                    });
                }
                console.log("File downloaded successfully");
            });
        });
    } catch (error) {
        console.log("Internal Server Error:", error);
        next(error);
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Something went wrong! Please try again later.",
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
