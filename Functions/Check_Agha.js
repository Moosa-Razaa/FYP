const fs = require("fs");
const PdfParse = require("pdf-parse");
const Regex = require("regex");

async function PDFReader(path)
{
    object_to_return = {};
    //First, Reading the content of the file.
    await PdfParse(path).then((file_content) => {
        const content = file_content.text.split('\n');
        // content.splice(0, 4);

        object_to_return["MR Number"] = content[8].split(' ')[1].trim();
        object_to_return["Patient Name"] = content[6].split(':')[1].trim();
        object_to_return["Test Name"] = content[25].replace(/[^a-zA-Z ]/g, "");
        object_to_return["Requesting Physician"] = content[14].split(':')[1];
        object_to_return["Lab No"] = content[10].split(':')[1];
        object_to_return["Date "] = content[21].substring(17,27);

    });
    return object_to_return;
}

module.exports = PDFReader;