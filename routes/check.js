const fs = require('fs');
const fs2 = require('fs-extra');
const PdfParse = require("pdf-parse");
const Regex = require("regex");
const rimraf = require("rimraf");

path = "F:\\Projects\\FYP\\Download";
user = "Moosa";
path2 = "F:\\Projects\\FYP\\Temp";

const PathFound = (Path, User) =>
{
    console.log(Path + "\\User-" + User);
    if (fs.existsSync(Path + "\\User-" + User))
    {
        return true;
    } 
    else
    {
        return false;
    } 
}

const CopyFolder = (Path, User, Path2) =>
{
    if(fs.existsSync(Path2 + "\\User-" + User))
    {
        console.log("Already Created");
        return true
    }
    else
    {
        Path = Path + "\\User-" + User;
        fs2.copy(Path, Path2 + "\\User-" + User);
        console.log("Copied to temp path");
        return true;
    }
}

const ReadValues = (Path, User, Path2) =>
{
    //console.log(Path, User, Path2);
    if(fs.existsSync(Path2 + "\\User-" + User + "\\AgakhanLab-" + User))
    {
        return_obj = [];
        Path = Path + "\\User-" + User + "\\AgaKhanLab-" + User;
        Path2 = Path2 + "\\User-" + User + "\\AgaKhanLab-" + User;
        console.log("Path resolved: " + Path2);
        let Reports = fs.readdirSync(Path2);
        //console.log(Reports);
        for(let i = 0; i < Reports.length; i++)
        {
            let path = Path2 + "//" + Reports[i];
            PDFReader(path).then((result) => {
                result["File Name"] = Reports[i];
                return_obj.push(result);
                //console.log(result);
            });

            //Reading values from the PDF file and sending it to the server.
            async function PDFReader(path)
            {
                object_to_return = {};
                //First, Reading the content of the file.
                await PdfParse(path).then((file_content) => {
                    const content = file_content.text.split('\n');

                    object_to_return["MR Number"] = content[8].split(' ')[1].trim();
                    object_to_return["Patient Name"] = content[6].split(':')[1].trim();
                    object_to_return["Test Name"] = content[25].replace(/[^a-zA-Z ]/g, "");
                    object_to_return["Requesting Physician"] = content[14].split(':')[1];
                    object_to_return["Lab No"] = content[10].split(':')[1];
                    object_to_return["Date "] = content[21].substring(17,27);

                });
                return object_to_return;
            }
        }
    }
    else if(! fs.existsSync(Path2 + "\\User-" + User + "\\DowLab-" + User))
    {
        console.log("Cannot resolve path: " + Path2);
        return "false";
    } 

}

const DeleteFolder = (Path, User) => 
{
    if (fs.existsSync(Path + "\\User-" + User))
    {
        Path = Path + "\\User-" + User;
        rimraf.sync(Path);
        console.log("Folder Deleted");
    } else console.log("Folder Not Found");
    
}

// CopyFolder(path, user, path2)
// ReadValues(path, user, path2)
// DeleteFolder(path2, user)
module.exports = {PathFound, CopyFolder, ReadValues, DeleteFolder};