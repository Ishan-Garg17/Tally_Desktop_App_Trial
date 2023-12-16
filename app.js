// import odbc from 'odbc';
import axios from 'axios';
import xml2js from 'xml2js';
import * as fs from 'fs';
// import { insertData } from './insertData';
// import odbc from 'odbc';

import { insertData, connect, insertVouchers } from './insertData.js';


const connectionString = 'DSN=TallyODBC64_9000';


// odbc.connect(connectionString, (err, connection) => {
//     if (err) {
//         console.error('Error connecting to ODBC driver:', err);
//         return;
//     }
//     connection.query('Select $Name, $Parent,$GUID FROM Ledger', (queryErr, result) => {
//         if (queryErr) {
//             console.error('Error executing query:', queryErr);
//         }
//         else {
//             async function main() {
//                 await connect(); // Connect to MongoDB

//                 await insertData("Ledgers", result); // Insert data
//             }
//             main()
//         }
//         connection.close((closeErr) => {
//             if (closeErr) {
//                 console.error('Error closing connection:', closeErr);
//             } else {
//                 console.log('Connection closed.');
//             }
//         });
//     });
// })


// XML request payload
const xmlRequest = `
   <ENVELOPE Action="">
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>CustomVoucherCollection</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVCURRENTCOMPANY>Unique Packaging Systems</SVCURRENTCOMPANY>
        <SVFROMDATE TYPE="Date">01-04-2023</SVFROMDATE>
        <SVTODATE TYPE="Date">31-07-2023</SVTODATE>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION ISMODIFY="No" ISFIXED="No" ISINITIALIZE="No" ISOPTION="No" ISINTERNAL="No" NAME="CustomVoucherCollection">
            <TYPE>Vouchers</TYPE>
            <NATIVEMETHOD>*, *.*</NATIVEMETHOD>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>
`;


// Send XML request to server
async function sendXMLRequest() {
  try {
    const response = await axios.post('http://localhost:9000', xmlRequest, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    // Parse XML response into JSON
    const xmlResponse = response.data;
    const jsonResponse = await xmlToJSON(xmlResponse);

    const vouchersList = jsonResponse.ENVELOPE.BODY[0].DATA[0].COLLECTION[0].VOUCHER;


    let mainData = {};
    let count = 0;

    for (let item of vouchersList) {
      const keysToExtract = ['$', 'ADDRESS.LIST', 'DATE', "GUID", "NARRATION", "PARTYGSTIN", "PLACEOFSUPPLY", "PARTYNAME", "GSTREGISTRATION", "CMPGSTIN", "PARTYLEDGERNAME", "VOUCHERNUMBER", "REFERENCE", "MASTERID", "VOUCHERKEY", "VOUCHERRETAINKEY"]; // Specify the keys you want to extract
      const voucher = {};

      keysToExtract.forEach(key => {
        if (item.hasOwnProperty(key)) {
          voucher[key] = item[key];
        }
      });
      console.log("Loop - ", count, voucher.PARTYLEDGERNAME, voucher.VOUCHERNUMBER, voucher.$.VCHTYPE);
      if (voucher.PARTYLEDGERNAME[0] == '') {
        continue
      }
      const voucherDetails = await extractVoucherDetails(voucher.VOUCHERNUMBER, voucher.$.VCHTYPE);

      if (mainData[voucher.PARTYLEDGERNAME]) {
        console.log("\n\n\nAnother Voucher of same party", voucher.PARTYLEDGERNAME);
        if (mainData[voucher.PARTYLEDGERNAME].hasOwnProperty(voucher.$.VCHTYPE)) {

          const temp_new = {
            "VchNo": voucher.VOUCHERNUMBER,
            "date": voucher.DATE[0],
            "Narration": voucher.NARRATION[0],
            "details": voucherDetails
          }
          mainData[voucher.PARTYLEDGERNAME][voucher.$.VCHTYPE].push(temp_new);
        }
        else {
          console.log("\n\n\different Voucher Type ", voucher.PARTYLEDGERNAME, voucher.$.VCHTYPE);
          // console.log("the main data is", mainData);
          mainData[voucher.PARTYLEDGERNAME] = {
            ...mainData[voucher.PARTYLEDGERNAME],
            [voucher.$.VCHTYPE]: [{
              "VchNo": voucher.VOUCHERNUMBER,
              "date": voucher.DATE[0],
              "Narration": voucher.NARRATION[0],
              "details": voucherDetails
            }]
          }
        }
        continue
      }

      const temp = {
        [voucher.PARTYLEDGERNAME]: {
          [voucher.$.VCHTYPE]: [
            {
              "VchNo": [voucher.VOUCHERNUMBER],
              "date": voucher.DATE[0],
              "Narration": voucher.NARRATION[0],
              "details": voucherDetails
            }
          ]
        },
      }
      mainData = { ...mainData, ...temp };
      count++;
    }



    async function main() {
      await connect();
      await insertVouchers("Voucher-Details", mainData);
    }
    main()


  } catch (error) {
    console.error('Error sending request:', error);
  }
}

// Function to parse XML into JSON
function xmlToJSON(xml) {
  return new Promise((resolve, reject) => {
    const parser = new xml2js.Parser();
    parser.parseString(xml, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

sendXMLRequest();

async function extractVoucherDetails(vchNumber, vchType) {
  const xmlRequest2 = `
   <ENVELOPE>  
  <HEADER>  
    <VERSION>1</VERSION>  
    <TALLYREQUEST>EXPORT</TALLYREQUEST>  
    <TYPE>COLLECTION</TYPE>  
    <ID>RTSAllVouchers_FilterForVchNoAndVchType</ID>  
  </HEADER>  
  <BODY>  
    <DESC>  
      <STATICVARIABLES>  
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>    
        <RTS_KEY>${vchNumber}</RTS_KEY>  
        <RTS_VOUCHERTYPENAME>${vchType}</RTS_VOUCHERTYPENAME>  
      </STATICVARIABLES>  
      <TDL>  
        <TDLMESSAGE>  
          <!-- Retrieve all Vouchers for specified VoucherNo and VoucherType -->  
          <COLLECTION NAME="RTSAllVouchers_FilterForVchNoAndVchType" ISINITIALIZE="Yes">  
              <TYPE>Voucher</TYPE>  
              <FETCH>ALLLEDGERENTRIES.*</FETCH>  
              <FETCH>ALLINVENTORYENTRIES.*</FETCH>  
              <FILTER>RTS_FilterForVchNoAndVchType</FILTER>  
          </COLLECTION>  
          <VARIABLE NAME="RTS_KEY">  
            <TYPE> String</TYPE>  
          </VARIABLE>  
          <VARIABLE NAME="RTS_VOUCHERTYPENAME">  
            <TYPE>String</TYPE>  
          </VARIABLE>  
          <SYSTEM TYPE="FORMULAE" NAME="RTS_FilterForVchNoAndVchType">  
            $VoucherNumber = $$String:##RTS_KEY and $VoucherTypeName = $$String:##RTS_VOUCHERTYPENAME
          </SYSTEM>  
        </TDLMESSAGE>  
      </TDL>  
    </DESC>  
  </BODY>  
</ENVELOPE>  
`;
  const response = await axios.post('http://localhost:9000', xmlRequest2, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });

  // Parse XML response into JSON
  const xmlResponse = response.data;
  const jsonResponse = await xmlToJSON(xmlResponse);
  const data = jsonResponse.ENVELOPE.BODY[0].DATA[0].COLLECTION[0].VOUCHER[0]["ALLLEDGERENTRIES.LIST"];
  const voucherDetails = [];
  for (let item of data) {
    // console.log(item, item.LEDGERNAME);

    const temp = {
      "TYPE": item.LEDGERNAME ? item.LEDGERNAME[0] : '',
      "Amount": item.AMOUNT ? item.AMOUNT[0] : ''
    }
    voucherDetails.push(temp);
  }
  // console.log("vocher details are", voucherDetails);
  return voucherDetails;
}


