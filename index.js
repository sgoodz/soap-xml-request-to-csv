//imports
const fs = require("fs");
const { Parser } = require("json2csv");
const xml2js = require("xml2js");
const path = require("path");
const json2csv = require("json2csv").parse;

//global variables
const inputFolder = "./input";
let newRES;
let fileError = [];

//read directory and foreach file run script
fs.readdirSync(inputFolder).forEach((file) => {
  console.log(file);

  //read xml data and store in variable
  const xml_file = fs.readFileSync(inputFolder + "/" + file, "utf8");

  //unescape xml data
  const newXML = xml_file.replace(/&lt;/g, "<").replace(/&gt;/g, ">");

  //remove prefixes
  const stripNS = require("xml2js").processors.stripPrefix;

  //parse xml data and convert to json
  const parser = new xml2js.Parser({
    explicitArray: false,
    tagNameProcessors: [stripNS],
  });
  parser.parseString(newXML, function (err, result) {
    newRES = result;
    console.log("Done");
    // console.log(JSON.stringify(newRES));
  });

  //filter out the errors
  if (newRES.Envelope.Body.hasOwnProperty("Fault")) {
    fileError.push(file);
    console.log(fileError);
    fs.unlink(`./input/${file}`, function (err) {
      if (err) throw err;
    });
  }

  //destructure json data to only what we need - if you use this, change this to your preference
  newResponse = newRES.Envelope.Body.PostOrder_Result.outMsg.DH_Quote;
  console.log(JSON.stringify(newResponse));

  console.log(fileError);

  // //store nested object data to variables
  const contantInfo = newResponse.Contact;
  const paymentInfo = newResponse.Payment;

  // //remove nested object so we can convert to csv easier
  newResponse.Line = undefined;
  newResponse = JSON.parse(JSON.stringify(newResponse));

  // //append destructured object to object
  let finalResult = Object.assign(newResponse, contantInfo, paymentInfo);

  // //remove nested object now that it has been appended
  finalResult.Contact = undefined;
  finalResult = JSON.parse(JSON.stringify(finalResult));
  finalResult.Payment = undefined;
  finalResult = JSON.parse(JSON.stringify(finalResult));

  console.log("Final Result: ", finalResult);

  // //if fields left blank, use all headers
  const fields = [];

  // //write to file function
  const write = async (fileName, fields, data) => {
    // output file in the same folder
    const filename = path.join(__dirname, "CSV", `${fileName}`);
    let rows;

    // If file doesn't exist, we will create new file and add rows with headers.
    if (!fs.existsSync(filename)) {
      rows = json2csv(finalResult, { header: true });
    } else {
      // if file does exist we will add the data without headers, on a new row
      rows = json2csv(finalResult, { header: false });
    }

    // Append file function can create new file too.
    fs.appendFileSync(filename, rows);
    // Always add new line if file already exists.
    fs.appendFileSync(filename, "\r\n");
  };

  //write csv data to file, if file already exists create new row
  write("Output.csv", fields, finalResult);
});
