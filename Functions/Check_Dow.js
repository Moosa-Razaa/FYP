const fs = require("fs");
const PdfParse = require("pdf-parse");

const path = "C:\\Users\\ICON\\Desktop\\fyp\\slnm\\node\\patient\\dow.pdf";
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

        object_to_return["MR Number"] = content[3];
        object_to_return["Patient Name"] = content[10].split(':')[1].trim();
        object_to_return["Test Name"] = content[content.length-4];
        object_to_return["Requesting Physician"] = content[9];
        object_to_return["Lab No"] = content[7];
        object_to_return["Date "] = content[12];

        
    });
    return object_to_return;
}

module.exports = PDFReader;