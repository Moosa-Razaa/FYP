const fs = require("fs");
const PdfParse = require("pdf-parse");
const Regex = require("regex");

const path = "C:\\Users\\ICON\\Desktop\\fyp\\slnm\\node\\patient\\sin.pdf";
PDFReader(path).then((result) => {
    console.log(result);
});

async function PDFReader(path)
{
    object_to_return = {};
    //First, Reading the content of the file.
    await PdfParse(path).then((file_content) => {
        const content = file_content.text.split('\n');
        // content.splice(0, 4);

        object_to_return["MR Number"] = content[2].split(':')[1].trim();
        object_to_return["Patient Name"] = content[4].split(':')[1].trim();
        object_to_return["Test Name"] = content[10].split('|')[1].trim();
        object_to_return["Requesting Physician"] = content[6].split(':')[1];
        object_to_return["Lab No"] = content[8].split(':')[1];
        object_to_return["Date "] = content[13];

    });
    return object_to_return;
}

module.exports = PDFReader;