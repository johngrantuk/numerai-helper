const Box = require('3box');
const ErasureHelper = require('@erasure/crypto-ipfs');
const pinataSDK = require('@pinata/sdk');

function NumeraiHelper(SpaceName, EthAddress){
  this.spaceName = SpaceName;
  this.ethAddress = EthAddress;
}

async function Load3Box(EthAddress, SpaceName){
  var spaceData = await Box.getSpace(EthAddress, SpaceName);
  if(this.is3box){
    console.log('Loading 3Box Data...');
    spaceData = await Load3Box(this.ethAddress, this.spaceName);
    console.log(spaceData);
    this.spaceData = spaceData;
  }
  return spaceData;
}

async function SaveTo3Box(spaceName, DataKey, DataValue){
  const accounts = await window.ethereum.enable();
  const box = await Box.openBox(accounts[0], window.ethereum);
  console.log('Opening space: ' + spaceName)
  const space = await box.openSpace(spaceName);
  await space.syncDone;
  console.log('Opened');
  console.log('Saving...');
  await space.public.set(DataKey, DataValue);
  console.log('Saved')

}

/*
Returns postData
*/
NumeraiHelper.prototype.savePost = async function(RawData, StorageMethod, PinataApiKey, PinataApiSecret){

  if(StorageMethod === '3Box'){
    console.log('Saving Data To 3Box');

    var postData = await this.createPostData(RawData);
    console.log('Saving encrypted data to hash key: ' + postData.proofJson.encryptedDatahash);
    await SaveTo3Box(this.spaceName, postData.proofJson.encryptedDatahash, postData.encryptedData);

    console.log('Saving proof JSON to hash key: ' + postData.proofhash);
    await SaveTo3Box(this.spaceName, postData.proofhash, JSON.stringify(postData.proofJson));
    console.log('Data Saved.')
    return postData;

  }else{
    if(PinataApiKey === undefined || PinataApiSecret === undefined){
      console.log('Please call with Pinata Account Credentials');
      return;
    }

    const pinata = pinataSDK(PinataApiKey, PinataApiSecret);
    var pinataAuth = await pinata.testAuthentication();

    if(pinataAuth.authenticated !== true){
      console.log('Pinata Authentication Failed.')
      return;
    }
    postData = await this.createPostData(RawData);
    console.log('Saving encrypted data...');
    var pin = await pinata.pinJSONToIPFS({encryptedData: postData.encryptedData});
    if(pin.IpfsHash !== postData.proofJson.encryptedDatahash){
      console.log('Error with Encrypted Data Hash.');
      console.log(pin.IpfsHash)
      console.log(postData.proofJson.encryptedDatahash)
      return;
    }

    console.log('Saving proof JSON...');
    pin = await pinata.pinJSONToIPFS(postData.proofJson);
    if(pin.IpfsHash !== postData.proofhash){
      console.log('Error with proof Hash.');
      console.log(pin.IpfsHash)
      console.log(postData.proofhash)
      return;
    }
    console.log('Data Saved.')
    return postData;
  }
}

/*
This receives raw data, generate sym key, encrypts data and creates JSON proof hash for user to save to feed contract.

*/
NumeraiHelper.prototype.createPostData = async function(RawData){
  // SymKey Generate sym key
  const symmetricKey = ErasureHelper.crypto.symmetric.generateKey();    // base64 string

  // encryptedData Encrypt Raw Data
  const encryptedFile = ErasureHelper.crypto.symmetric.encryptMessage(symmetricKey, RawData);

  // keyhash Hash sym key
  const symmetricKeyHash = await ErasureHelper.multihash({
        input: symmetricKey,
        inputType: 'raw',
        outputType: 'hex',
      })

  // datahash sha256(rawdata)
  const dataHash = await ErasureHelper.multihash({
        input: RawData,
        inputType: 'raw',
        outputType: 'hex',
      })

  // encryptedDatahash = sha256(encryptedData)
  // This hash will match the IPFS pin hash
  const encryptedDataHash = await ErasureHelper.multihash({
        input: JSON.stringify({encryptedData: encryptedFile}),
        inputType: 'raw',
        outputType: 'b58',
      });

  // jsonblob_v1_2_0 = JSON(address_seller, salt, multihashformat(datahash), multihashformat(keyhash), multihashformat(encryptedDatahash))
  const jsonblob_v1_2_0 = {
    creator: this.ethAddress,
    salt: ErasureHelper.crypto.asymmetric.generateNonce(),
    datahash: dataHash,
    encryptedDatahash: encryptedDataHash,         // This allows the encrypted data to be located on IPFS or 3Box
    keyhash: symmetricKeyHash
  }

  // proofhash = sha256(jsonblob_v1_2_0)
  // This hash will match the IPFS pin hash. It should be saved to the users feed contract.
  const proofHash58 = await ErasureHelper.multihash({
        input: JSON.stringify(jsonblob_v1_2_0),
        inputType: 'raw',
        outputType: 'b58',
      })

  console.log(RawData);
  console.log(encryptedFile);
  console.log(symmetricKey);
  console.log(symmetricKeyHash);
  console.log(dataHash);
  console.log(encryptedDataHash);
  console.log(proofHash58);

  return {
    proofJson: jsonblob_v1_2_0,
    proofhash: proofHash58,
    symmetricKey: symmetricKey,
    encryptedData: encryptedFile
  };
}

NumeraiHelper.prototype.retrievePost = async function(SymKey_Buyer){

  // get from storage: jsonblob_v1_2_0 @ proofhash
  // keyhash
  // datahash
  // encryptedDatahash

  // get from storage: encryptedData @ encryptedDatahash

  // rawdata = SymKey.decrypt(encryptedData)

  // validates keyhash matches sha256(SymKey)
  // validates datahash matches sha256(rawdata)

  // could add smart contract section too??
}

NumeraiHelper.prototype.retrievePost = async function(SymKey_Buyer){
  // ErasureClient_Seller uploads SymKey to ipfs at multihashformat(keyhash)
  // ErasureClient_Seller uploads rawdata to ipfs at multihashformat(datahash)
}
/* Selling

Need buyer public key.
Encrypt SymKey with BuyerPubKey
Submit EncSymKey to Griefing contract.
*/
/* Buying/Reveal
Get EncSymKey from Griefing contract.
Decrypt SymKey
Confirm SymKey hash is correct.
Get Encrypted data from storage.
Decrypt data.
Confirm data hash.
*/

module.exports = NumeraiHelper
