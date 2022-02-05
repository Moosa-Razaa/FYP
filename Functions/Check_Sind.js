const PdfParse = require("pdf-parse");

async function PDFReader(path)
{
    let object_to_return = {};
    //First, Reading the content of the file.
    await PdfParse(path).then((file_content) => {
        const content = file_content.text.split('\n');
        // content.splice(0, 4);
        
        object_to_return["MR Number"] = content[2].split(':')[1].trim();
        object_to_return["Patient Name"] = content[4].split(':')[1].trim();
        if(object_to_return["Test Name"] = content[10].split('|')[1] === undefined)
        {
            object_to_return["Test Name"] = content[11].split('|')[1];    
        }
        else
        {
            object_to_return["Test Name"] = content[10].split('|')[1];
        }
        
        object_to_return["Requesting Physician"] = content[6].split(':')[1];
        object_to_return["Lab No"] = content[8].split(':')[1];
        object_to_return["Date "] = content[13];
        return object_to_return;
    }).catch((reject) => console.log(reject));
}

module.exports = PDFReader;