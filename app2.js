
import axios from 'axios';
import xml2js from 'xml2js';
import * as fs from 'fs';
import odbc from 'odbc';
import { response } from './response.js';
const purchaseapiUrl = 'http://localhost:3000/purchaseVouchers';
const salesapiUrl = 'http://localhost:3000/salesVouchers';
const paymentapiUrl = 'http://localhost:3000/paymentVouchers';
const receiptapiUrl = 'http://localhost:3000/receiptVouchers';
const stocksAPIUrl = 'http://localhost:3000/stockItems';


const connectionString = 'DSN=TallyODBC64_9000';
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

const xmlRequest = ` <ENVELOPE>  
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
        <RTS_KEY>3078</RTS_KEY>  
        <RTS_VOUCHERTYPENAME>Sales</RTS_VOUCHERTYPENAME>  
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
</ENVELOPE> `

const ledgersXML = `<ENVELOPE>
    <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>EXPORT</TALLYREQUEST>
        <TYPE>COLLECTION</TYPE>
        <ID>List of Ledgers</ID>
    </HEADER>
    <BODY>
        <DESC>
            <STATICVARIABLES>
                <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
            </STATICVARIABLES>
        </DESC>
    </BODY>
</ENVELOPE>`

const purchaseVoucherXML = `
      <ENVELOPE>
<HEADER>
<TALLYREQUEST>Export Data</TALLYREQUEST>
</HEADER>
<BODY>
<EXPORTDATA>
<REQUESTDESC>
<STATICVARIABLES>
<SVCURRENTCOMPANY>UNIQUE PACKAGING SYSTEMS</SVCURRENTCOMPANY>
<!--Specify the Period here-->
<SVFROMDATE>20230401</SVFROMDATE>
<SVTODATE>20231101</SVTODATE>

<VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>

<!--Detailed or Condensed Format-->
<EXPLODEFLAG>Yes</EXPLODEFLAG>

<!--Specify the Report FORMAT here-->
<SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
</STATICVARIABLES>

<!--Specify the Report Name here-->
<REPORTNAME>Voucher Register</REPORTNAME>
</REQUESTDESC>
</EXPORTDATA>
</BODY>
</ENVELOPE>
`

const salesVoucherXML = `
      <ENVELOPE>
<HEADER>
<TALLYREQUEST>Export Data</TALLYREQUEST>
</HEADER>
<BODY>
<EXPORTDATA>
<REQUESTDESC>
<STATICVARIABLES>
<SVCURRENTCOMPANY>UNIQUE PACKAGING SYSTEMS</SVCURRENTCOMPANY>
<!--Specify the Period here-->
<SVFROMDATE>20230706</SVFROMDATE>
<SVTODATE>20230707</SVTODATE>

<VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>

<!--Detailed or Condensed Format-->
<EXPLODEFLAG>Yes</EXPLODEFLAG>

<!--Specify the Report FORMAT here-->
<SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
</STATICVARIABLES>

<!--Specify the Report Name here-->
<REPORTNAME>Voucher Register</REPORTNAME>
</REQUESTDESC>
</EXPORTDATA>
</BODY>
</ENVELOPE>
`


const paymentVoucherXML = `
      <ENVELOPE>
<HEADER>
<TALLYREQUEST>Export Data</TALLYREQUEST>
</HEADER>
<BODY>
<EXPORTDATA>
<REQUESTDESC>
<STATICVARIABLES>
<SVCURRENTCOMPANY>UNIQUE PACKAGING SYSTEMS</SVCURRENTCOMPANY>
<!--Specify the Period here-->
<SVFROMDATE>20230706</SVFROMDATE>
<SVTODATE>20230707</SVTODATE>

<VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>

<!--Detailed or Condensed Format-->
<EXPLODEFLAG>Yes</EXPLODEFLAG>

<!--Specify the Report FORMAT here-->
<SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
</STATICVARIABLES>

<!--Specify the Report Name here-->
<REPORTNAME>Voucher Register</REPORTNAME>
</REQUESTDESC>
</EXPORTDATA>
</BODY>
</ENVELOPE>
`

const receiptVoucherXML = `
      <ENVELOPE>
<HEADER>
<TALLYREQUEST>Export Data</TALLYREQUEST>
</HEADER>
<BODY>
<EXPORTDATA>
<REQUESTDESC>
<STATICVARIABLES>
<SVCURRENTCOMPANY>UNIQUE PACKAGING SYSTEMS</SVCURRENTCOMPANY>
<!--Specify the Period here-->
<SVFROMDATE>20230706</SVFROMDATE>
<SVTODATE>20230707</SVTODATE>

<VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>

<!--Detailed or Condensed Format-->
<EXPLODEFLAG>Yes</EXPLODEFLAG>

<!--Specify the Report FORMAT here-->
<SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
</STATICVARIABLES>

<!--Specify the Report Name here-->
<REPORTNAME>Voucher Register</REPORTNAME>
</REQUESTDESC>
</EXPORTDATA>
</BODY>
</ENVELOPE>
`

const stockitemsXML = `
     <ENVELOPE>
    <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>EXPORT</TALLYREQUEST>
        <TYPE>COLLECTION</TYPE>
        <ID>CUSTOMSTOCKITEMCOL</ID>
    </HEADER>
    <BODY>
        <DESC>
            <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
            <TDL>
                <TDLMESSAGE>
                    <COLLECTION ISMODIFY="No" ISFIXED="No" ISINITIALIZE="No" ISOPTION="No" ISINTERNAL="No" NAME="CUSTOMSTOCKITEMCOL">
                        <TYPE>STOCKITEM</TYPE>
                       <FETCH>*</FETCH>
                    </COLLECTION>
                </TDLMESSAGE>
            </TDL>
        </DESC>
    </BODY>
</ENVELOPE>
`

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
    const FINAL = jsonResponse.ENVELOPE.BODY[0].DATA[0].COLLECTION[0].item;
    console.log('====================================');
    console.log(FINAL);
    console.log('====================================');
    fs.writeFile('output.json', JSON.stringify(FINAL), (err) => {
      if (err) {
        console.error('Error writing to file:', err);
      } else {
        console.log('JSON data written to file successfully!');
      }
    });


  } catch (error) {
    console.error('Error sending request:', error);
  }
}

async function fetchLedgers() {
  try {
    const response = await axios.post('http://localhost:9000', ledgersXML, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    // Parse XML response into JSON
    const xmlResponse = response.data;
    const jsonResponse = await xmlToJSON(xmlResponse);
    const FINAL = jsonResponse.ENVELOPE.BODY[0].DATA[0].COLLECTION[0].LEDGER;
    const apiUrl = 'http://localhost:3000/updateLedgers';
    const ledgersArray = [];

    for (let item of FINAL) {
      ledgersArray.push(item.$.NAME)
    }
    //ADD INTERNAL DB FOR DESKTOP APP AND THEN LOGIC FOR NEW LEDGERS ADDED WILL BE IMPLEMENTED 
    axios.post(apiUrl, { ledgersArray })
      .then(response => {
        console.log('API Response:', response.data);
      })
      .catch(error => {
        console.error('Error:', error.message);
      });

  } catch (error) {
    console.error('Error sending request:', error);
  }
}


function sendChunkToServer(chunk, apiUrl) {
  // Use AJAX, Fetch API, or any other method to send the chunk to the server
  console.log("THE CHUNK IS", chunk);
  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chunk }),
  })
    .then(response => response.json())
    .then(data => {
      // Handle the response from the server
      console.log(data);
    })
    .catch(error => {
      // Handle errors
      console.error('Error sending chunk to server:', error);
    });
}



async function fetchPurchaseVouchers() {
  console.log("Sending Request");
  try {
    const response = await axios.post('http://localhost:9000', purchaseVoucherXML, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    // Parse XML response into JSON
    const xmlResponse = response.data;
    const jsonResponse = await xmlToJSON(xmlResponse);

    //KEPP NOTES OF BELOW APPROACH-:

    // const destructuredArray = vouchersData.map(({ VOUCHER }) => {
    //   // Now, Voucher is the destructured key from each object
    //   return VOUCHER;
    // });
    // const newVouchersData = [];
    // for (let item of destructuredArray) {
    //   const filteredObject = Object.keys(item).reduce((acc, key) => {
    //     const value = item[key];
    //     console.log("The value is", value, key);
    //     // Check if the value is not empty (null, undefined, empty string, or empty object)
    //     if (value !== null && value !== undefined && value !== '' && !(typeof value === 'object' && Object.keys(value).length === 0)) {
    //       console.log("entered if");
    //       acc[key] = value;
    //     }

    //     return acc;
    //   }, {});
    //   newVouchersData.push(filteredObject);
    // }
    const vouchersData = jsonResponse.ENVELOPE.BODY[0].IMPORTDATA[0].REQUESTDATA[0].TALLYMESSAGE;

    const destructuredArray = vouchersData.map(({ VOUCHER }) => {
      return VOUCHER;
    });

    // const newVouchersData = vouchersData.map(({ VOUCHER }) => {
    //   // Use Object.entries to get both key and value in a single iteration
    //   return Object.entries(VOUCHER).reduce((acc, [key, value]) => {
    //     // Check if the value is not empty (null, undefined, empty string, or empty object)
    //     if (value !== null && value !== undefined && value !== '' && !(typeof value === 'object' && Object.keys(value).length === 0)) {
    //       acc[key] = value;
    //     }
    //     return acc;
    //   }, {});
    // });
    const purchaseVouchers = [];
    let count = 0;
    for (let voucher of destructuredArray) {
      if (voucher) {
        let item = voucher[0]
        const ADDRESS = item?.["ADDRESS.LIST"]?.[0]?.ADDRESS;
        const DATE = item?.DATE;
        const GUID = item?.GUID;
        const STATENAME = item?.STATENAME;
        const NARRATION = item?.NARRATION;
        const COUNTRYOFRESIDENCE = item?.COUNTRYOFRESIDENCE;
        const PARTYGSTIN = item?.PARTYGSTIN;
        const PLACEOFSUPPLY = item?.PLACEOFSUPPLY;
        const PARTYNAME = item?.PARTYNAME;
        const PARTYLEDGERNAME = item?.PARTYLEDGERNAME;
        const VOUCHERNUMBER = item?.VOUCHERNUMBER;
        const purchaseData = item?.["ALLLEDGERENTRIES.LIST"]
        const totalAmount = Math.abs(purchaseData[0]?.AMOUNT);
        const PURCHASELOCAL = Math.abs(purchaseData[1]?.AMOUNT);
        const CGST = Math.abs(purchaseData[2]?.AMOUNT);
        const SGST = Math.abs(purchaseData[3]?.AMOUNT);

        const combinedData = {
          ADDRESS: ADDRESS,
          DATE: DATE,
          GUID: GUID,
          STATENAME: STATENAME,
          NARRATION: NARRATION,
          COUNTRYOFRESIDENCE: COUNTRYOFRESIDENCE,
          PARTYGSTIN: PARTYGSTIN,
          PLACEOFSUPPLY: PLACEOFSUPPLY,
          PARTYNAME: PARTYNAME,
          PARTYLEDGERNAME: PARTYLEDGERNAME,
          VOUCHERNUMBER: VOUCHERNUMBER,
          totalAmount: totalAmount,
          PURCHASELOCAL: PURCHASELOCAL,
          CGST: CGST,
          SGST: SGST,
        };

        purchaseVouchers.push(combinedData)

      }
    }

    const chunkSize = 6; // Set the desired chunk size
    console.log("Total length", purchaseVouchers.length);
    const totalChunks = Math.ceil(purchaseVouchers.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = (i + 1) * chunkSize;
      const chunk = purchaseVouchers.slice(start, end);

      // Send each chunk to the server
      sendChunkToServer(chunk, purchaseapiUrl);
    }


  } catch (error) {
    console.error('Error sending request:', error);
  }
}


async function fetchSalesVouchers() {
  console.log("Sending Request");
  try {
    const response = await axios.post('http://localhost:9000', salesVoucherXML, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    // Parse XML response into JSON
    const xmlResponse = response.data;
    const jsonResponse = await xmlToJSON(xmlResponse);

    const vouchersData = jsonResponse.ENVELOPE.BODY[0].IMPORTDATA[0].REQUESTDATA[0].TALLYMESSAGE;

    const destructuredArray = vouchersData.map(({ VOUCHER }) => {
      return VOUCHER;
    });
    // const newArr = []
    const salesVouchers = [];

    for (let voucher of destructuredArray) {
      // if (+(voucher?.[0]?.VOUCHERNUMBER[0]) == 4003) {


      if (voucher) {
        const ADDRESS = voucher[0]?.["BASICBUYERADDRESS.LIST"]?.BASICBUYERADDRESS;
        const DATE = voucher[0]?.DATE[0];
        const GUID = voucher[0]?.GUID[0];

        // console.log("TERMS IS", voucher[0])
        // const TERMS = voucher[0]?.["BASICORDERTERMS.LIST"][0]?.BASICORDERTERMS[0] || null;

        const STATENAME = voucher[0]?.STATENAME[0] || voucher[0]?.CONSIGNEEGSTIN[0];

        const NARRATION = voucher[0]?.NARRATION;

        const COUNTRYOFRESIDENCE = voucher[0]?.COUNTRYOFRESIDENCE;

        const PARTYGSTIN = voucher[0]?.PARTYGSTIN[0] || voucher[0]?.CONSIGNEEGSTIN[0];

        const PLACEOFSUPPLY = voucher[0]?.PLACEOFSUPPLY[0];

        const PARTYNAME =
          voucher[0]?.PARTYNAME[0] ||
          voucher[0]?.PARTYLEDGERNAME[0] ||
          voucher[0]?.BASICBUYERNAME[0];

        const VOUCHERNUMBER = voucher[0]?.VOUCHERNUMBER[0];

        const SHIPPEDBY = voucher[0]?.BASICSHIPPEDBY[0];
        const VEHICLENO = voucher[0]?.BASICSHIPVESSELNO[0];
        const DETAILS = voucher[0]?.["INVOICEORDERLIST.LIST"];

        const inventoryItems = []

        const saleItems = voucher[0]?.["ALLINVENTORYENTRIES.LIST"]

        for (let item of saleItems) {
          // console.log(item.STOCKITEMNAME);
          if (item) {


            const STOCKITEM = item?.STOCKITEMNAME?.[0]
            const HSNCODE = item?.GSTHSNNAME?.[0]
            const RATE = item?.RATE?.[0]
            const DISCOUNT = +(item?.DISCOUNT?.[0])
            const AMOUNT = +(item?.AMOUNT?.[0])
            const ACTUALQTY = item?.ACTUALQTY?.[0] || item?.BILLEDQTY?.[0]
            const combinedObj = {
              STOCKITEM: STOCKITEM,
              HSNCODE: HSNCODE,
              RATE: RATE,
              DISCOUNT: DISCOUNT,
              AMOUNT: AMOUNT,
              ACTUALQTY: ACTUALQTY
            }
            inventoryItems.push(combinedObj)
          }
        }


        //LEDGER ENTERIES - CHECK IF THERE ARE 2 ONLY IN ALL THE VOUCHERS OTHERWISE USE A FOR LOOP
        const totalAmount = voucher[0]?.["LEDGERENTRIES.LIST"][0]?.AMOUNT?.[0];
        const IGSTSALE = voucher[0]?.["LEDGERENTRIES.LIST"][1]?.AMOUNT?.[0];


        const finalVoucherObj = {
          ADDRESS: ADDRESS,
          DATE: DATE,
          GUID: GUID,
          STATENAME: STATENAME,
          NARRATION: NARRATION,
          COUNTRYOFRESIDENCE: COUNTRYOFRESIDENCE,
          PARTYGSTIN: PARTYGSTIN,
          PLACEOFSUPPLY: PLACEOFSUPPLY,
          PARTYNAME: PARTYNAME,
          VOUCHERNUMBER: VOUCHERNUMBER,
          // TERMS: TERMS || null,
          SHIPPEDBY: SHIPPEDBY,
          VEHICLENO: VEHICLENO,
          DETAILS: DETAILS,
          totalAmount: totalAmount,
          IGSTSALE: IGSTSALE,
          INVENTORY_ITEMS: inventoryItems
        };

        salesVouchers.push(finalVoucherObj)
        console.log("voucher object is", finalVoucherObj);
      }
    }
    // }
    // console.log("VOUCHERSS", salesVouchers, salesVouchers.length)

    // let count = 0
    // for (let voucher of destructuredArray) {
    //   if (+(voucher?.[0]?.VOUCHERNUMBER[0]) == 4003) {
    //     console.log("the vochuer is ", count, voucher[0]?.PARTYNAME[0] ||
    //       voucher[0]?.PARTYLEDGERNAME[0] ||
    //       voucher[0]?.BASICBUYERNAME[0])
    //   }
    //   count++;
    // }


    // console.log("ff", salesVouchers, inventoryItems)
    // fs.writeFile('salesVoucher.json', JSON.stringify(destructuredArray[233]), (err) => {
    //   if (err) {
    //     console.error('Error writing to file:', err);
    //   } else {
    //     console.log('JSON data written to file successfully!');
    //   }
    // });

    // const saleItems = destructuredArray[233]?.[0]?.["ALLINVENTORYENTRIES.LIST"]

    // for (let item of saleItems) {
    //   // console.log(item);
    //   if (item) {
    //     const STOCKITEM = item?.STOCKITEMNAME?.[0]
    //     const HSNCODE = item?.GSTHSNNAME?.[0]
    //     const RATE = item?.RATE?.[0]
    //     const DISCOUNT = +(item?.DISCOUNT?.[0])
    //     const AMOUNT = +(item?.AMOUNT?.[0])
    //     const ACTUALQTY = item?.ACTUALQTY?.[0] || item?.BILLEDQTY?.[0]
    //     console.log("ff", STOCKITEM, RATE, AMOUNT, ACTUALQTY);
    //   }
    // }

    const chunkSize = 10; // Set the desired chunk size
    console.log("Total length", salesVouchers.length);
    const totalChunks = Math.ceil(salesVouchers.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = (i + 1) * chunkSize;
      const chunk = salesVouchers.slice(start, end);

      // Send each chunk to the server
      sendChunkToServer(chunk, salesapiUrl);
    }


  } catch (error) {
    console.error('Error sending request:', error);
  }
}

async function fetchPaymentVouchers() {
  console.log("Sending Request");
  try {
    const response = await axios.post('http://localhost:9000', paymentVoucherXML, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    const xmlResponse = response.data;
    const jsonResponse = await xmlToJSON(xmlResponse);

    const vouchersData = jsonResponse.ENVELOPE.BODY[0].IMPORTDATA[0].REQUESTDATA[0].TALLYMESSAGE;

    const destructuredArray = vouchersData.map(({ VOUCHER }) => {
      return VOUCHER;
    });

    const paymentVouchers = [];

    for (let voucher of destructuredArray) {
      if (voucher) {
        const DATE = voucher[0]?.DATE[0];
        const GUID = voucher[0]?.GUID[0];

        const STATENAME = voucher[0]?.STATENAME[0] || voucher[0]?.CONSIGNEEGSTIN[0];

        const NARRATION = voucher[0]?.NARRATION?.[0];
        const VOUCHERNUMBER = +(voucher[0]?.VOUCHERNUMBER?.[0]);

        const COUNTRYOFRESIDENCE = voucher[0]?.COUNTRYOFRESIDENCE?.[0];

        const PARTYGSTIN = voucher[0]?.CMPGSTIN[0]


        const GSTREGISTRATIONTYPE = voucher[0]?.GSTREGISTRATIONTYPE[0];

        const PARTYLEDGERNAME = voucher[0]?.PARTYLEDGERNAME[0];

        // const ENTERIES = voucher[0]?.["ALLLEDGERENTRIES.LIST"][1]?.["BANKALLOCATIONS.LIST"][0]
        const ENTERIES = voucher[0]?.["ALLLEDGERENTRIES.LIST"][1]
        // console.log("AMOUNT", ENTERIES.AMOUNT);
        const LEDGERNAME = ENTERIES?.LEDGERNAME?.[0]
        const AMOUNT = +(ENTERIES?.AMOUNT?.[0])
        const TRANSACTIONTYPE = ENTERIES?.["BANKALLOCATIONS.LIST"][0]?.TRANSACTIONTYPE?.[0]
        const PAYMENTFAVOURING = ENTERIES?.["BANKALLOCATIONS.LIST"][0]?.PAYMENTFAVOURING?.[0]
        const CHEQUECROSSCOMMENT = ENTERIES?.["BANKALLOCATIONS.LIST"][0]?.CHEQUECROSSCOMMENT?.[0]

        const finalVoucherObj = {
          DATE: DATE,
          NARRATION: NARRATION,
          VOUCHERNUMBER: VOUCHERNUMBER,
          GUID: GUID,
          STATENAME: STATENAME,
          COUNTRYOFRESIDENCE: COUNTRYOFRESIDENCE,
          PARTYGSTIN: PARTYGSTIN,
          PARTYLEDGERNAME: PARTYLEDGERNAME,
          GSTREGISTRATIONTYPE: GSTREGISTRATIONTYPE,
          TRANSACTIONTYPE: TRANSACTIONTYPE,
          PAYMENTFAVOURING: PAYMENTFAVOURING,
          CHEQUECROSSCOMMENT: CHEQUECROSSCOMMENT,
          AMOUNT: AMOUNT,
          LEDGERNAME: LEDGERNAME,
        };

        paymentVouchers.push(finalVoucherObj)
      }
      // break;
    }

    console.log("VOUCHERSS", paymentVouchers[0], paymentVouchers.length)

    // fs.writeFile('hellonew', JSON.stringify(destructuredArray[10]), (err) => {
    //   if (err) {
    //     console.error('Error writing to file:', err);
    //   } else {
    //     console.log('JSON data written to file successfully!');
    //   }
    // });


    const chunkSize = 10; // Set the desired chunk size
    console.log("Total length", paymentVouchers.length);
    const totalChunks = Math.ceil(paymentVouchers.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = (i + 1) * chunkSize;
      const chunk = paymentVouchers.slice(start, end);

      // Send each chunk to the server
      sendChunkToServer(chunk, paymentapiUrl);
    }
    // sendChunkToServer(paymentVouchers, paymentapiUrl);

  }
  catch (error) {
    console.error('Error sending request:', error);
  }

}

async function fetchReceiptVouchers() {
  console.log("Sending Request");
  try {
    const response = await axios.post('http://localhost:9000', receiptVoucherXML, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    const xmlResponse = response.data;
    const jsonResponse = await xmlToJSON(xmlResponse);

    const vouchersData = jsonResponse.ENVELOPE.BODY[0].IMPORTDATA[0].REQUESTDATA[0].TALLYMESSAGE;

    const destructuredArray = vouchersData.map(({ VOUCHER }) => {
      return VOUCHER;
    });

    const receiptVouchers = [];

    for (let voucher of destructuredArray) {
      if (voucher) {
        const DATE = voucher[0]?.DATE[0];
        const GUID = voucher[0]?.GUID[0];
        const NARRATION = voucher[0]?.NARRATION?.[0];
        const VOUCHERNUMBER = +(voucher[0]?.VOUCHERNUMBER?.[0]);
        const PARTYGSTIN = voucher[0]?.CMPGSTIN[0]
        const ENTERIES = voucher[0]?.["ALLLEDGERENTRIES.LIST"]

        const PARTYLEDGERNAME = voucher[0]?.PARTYLEDGERNAME[0] || ENTERIES?.[0]?.LEDGERNAME?.[0]

        const AMOUNT = +(ENTERIES?.[0]?.AMOUNT?.[0] || ENTERIES?.[0]?.VATEXPAMOUNT?.[0])
        const TRANSACTIONTYPE = ENTERIES?.[1]?.["BANKALLOCATIONS.LIST"][0]?.TRANSACTIONTYPE?.[0] || "N/A"
        const PAYMENTFAVOURING = ENTERIES?.[1]?.["BANKALLOCATIONS.LIST"][0]?.PAYMENTFAVOURING?.[0] || "N/A"
        const CHEQUECROSSCOMMENT = ENTERIES?.[1]?.["BANKALLOCATIONS.LIST"][0]?.CHEQUECROSSCOMMENT?.[0] || "N/A"

        const finalVoucherObj = {
          DATE: DATE,
          NARRATION: NARRATION,
          VOUCHERNUMBER: VOUCHERNUMBER,
          GUID: GUID,
          PARTYGSTIN: PARTYGSTIN,
          PARTYLEDGERNAME: PARTYLEDGERNAME,
          TRANSACTIONTYPE: TRANSACTIONTYPE,
          PAYMENTFAVOURING: PAYMENTFAVOURING,
          CHEQUECROSSCOMMENT: CHEQUECROSSCOMMENT,
          AMOUNT: AMOUNT,
        };

        receiptVouchers.push(finalVoucherObj)
      }
      // break;
    }

    // console.log("VOUCHERSS", receiptVouchers[10], receiptVouchers.length)

    // fs.writeFile('receipt', JSON.stringify(destructuredArray[10]), (err) => {
    //   if (err) {
    //     console.error('Error writing to file:', err);
    //   } else {
    //     console.log('JSON data written to file successfully!');
    //   }
    // });


    const chunkSize = 10; // Set the desired chunk size
    console.log("Total length", receiptVouchers.length);
    const totalChunks = Math.ceil(receiptVouchers.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = (i + 1) * chunkSize;
      const chunk = receiptVouchers.slice(start, end);

      // Send each chunk to the server
      sendChunkToServer(chunk, receiptapiUrl);
    }
    // sendChunkToServer(receiptVouchers, receiptapiUrl);

  }
  catch (error) {
    console.error('Error sending request:', error);
  }

}


async function fetchStockItems() {
  console.log("Sending Request");
  try {
    const response = await axios.post('http://localhost:9000', stockitemsXML, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    // Parse XML response into JSON
    const xmlResponse = response.data;
    const jsonResponse = await xmlToJSON(xmlResponse);

    const stockItemsData = jsonResponse.ENVELOPE.BODY[0].DATA[0].COLLECTION[0].STOCKITEM;

    // console.log(stockItemsData);
    const stockItems = [];

    for (let item of stockItemsData) {
      if (item) {
        const BASEUNITS = item?.BASEUNITS[0];
        const GUID = item?.GUID[0];
        const OPENINGBALANCE = item?.OPENINGBALANCE[0];
        const HSNCODE = item?.["HSNDETAILS.LIST"][0].HSNCODE[0];
        const ITEMNAME = item?.["LANGUAGENAME.LIST"][0]?.["NAME.LIST"][0]?.NAME[0];


        const combinedData = {
          BASEUNITS: BASEUNITS,
          GUID: GUID,
          OPENINGBALANCE: OPENINGBALANCE,
          HSNCODE: HSNCODE,
          ITEMNAME: ITEMNAME
        };

        stockItems.push(combinedData)

      }
    }


    const chunkSize = 20; // Set the desired chunk size
    console.log("Total length", stockItems.length);
    const totalChunks = Math.ceil(stockItems.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = (i + 1) * chunkSize;
      const chunk = stockItems.slice(start, end);

      // Send each chunk to the server
      sendChunkToServer(chunk, stocksAPIUrl);
    }


  } catch (error) {
    console.error('Error sending request:', error);
  }
}



// await fetchLedgers();
// await fetchStockItems()
// await fetchPurchaseVouchers();
await fetchSalesVouchers()
// await fetchPaymentVouchers()
// await fetchReceiptVouchers()
