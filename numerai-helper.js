const Box = require('3box');
const ErasureHelper = require('@erasure/crypto-ipfs');
const pinataSDK = require('@pinata/sdk');

function NumeraiHelper(SpaceName, is3box, EthAddress){
  this.spaceName = SpaceName;
  this.ethAddress = EthAddress;
  this.is3box = is3box;
}

async function Load3Box(EthAddress, SpaceName){
  const spaceData = await Box.getSpace(EthAddress, SpaceName);
  return spaceData;
}

async function SaveTo3Box(DataKey, DataValue){
  const accounts = await window.ethereum.enable();
  const box = await Box.openBox(accounts[0], window.ethereum);
  const space = await box.openSpace(this.spaceName);
  await space.syncDone;
  console.log('Opened');
  console.log('Saving...');
  await space.public.set(DataKey, DataValue);
  console.log('Saved')

}

async function SaveToIPFS(JSONtoPin){
  const pinata = pinataSDK('d55715fbb802a4a9f6e6', '875e23ab07418b3164f63cc419c9977ed36380eb141f70a21b1bdd8937347d28');
  var pinataAuth = await pinata.testAuthentication();
  // Check auth is ok.
  //console.log('Pinata: ');
  //console.log(pinataAuth);

  // save: jsonblob_v1_2_0 @ proofhash
  // save: encryptedData @ encryptedDatahash
  // var pin = await pinata.pinJSONToIPFS({encryptedData: encryptedFile});
  var pin = await pinata.pinJSONToIPFS(JSONtoPin);

  console.log(pin)

  // var pin = await pinata.pinJSONToIPFS(jsonblob_v1_2_0);
  // console.log(pin);

}

PostHelper.prototype.test = async function(){
  console.log('Testing: ' + this.spaceName);
  this.createPost('test create post');
  return;
  if(this.is3box){
    console.log('Loading 3Box Data...');
    var spaceData = await Load3Box(this.ethAddress, this.spaceName);
    console.log(spaceData);
    this.spaceData = spaceData;
  }
}

PostHelper.prototype.save = async function(DataKey, DataValue){
  if(this.is3box){
    console.log('Saving in 3Box');
  }else{
    console.log('Saving in IPFS');
  }
}

/*
This receives raw data, generate sym key, encrypts data and creates JSON proof hash for user to save to feed contract.

*/
PostHelper.prototype.createPost = async function(RawData){
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
  /*
  const encryptedDataHash = await ErasureHelper.multihash({
        input: encryptedFile,
        inputType: 'raw',
        outputType: 'hex',
      })
  */
  // This hash will match the IPFS pin hash
  const encryptedDataHash = await ErasureHelper.multihash({
        input: JSON.stringify({encryptedData: encryptedFile}),
        inputType: 'raw',
        outputType: 'b58',
      });

  // jsonblob_v1_2_0 = JSON(address_seller, salt, multihashformat(datahash), multihashformat(keyhash), multihashformat(encryptedDatahash))
  const jsonblob_v1_2_0 = {
    address_seller: this.ethAddress,
    salt: ErasureHelper.crypto.asymmetric.generateNonce(),
    datahash: dataHash,
    encryptedDataHash: encryptedDataHash,         // This allows the encrypted data to be located on IPFS or 3Box
    keyHash: symmetricKeyHash
  }

  // proofhash = sha256(jsonblob_v1_2_0)
  /*
  const proofHash = await ErasureHelper.multihash({
        input: JSON.stringify(jsonblob_v1_2_0),
        inputType: 'raw',
        outputType: 'hex',
      })
  */
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

  // return proofhash for user to save to contract or could add
  return proofHash58;
}

PostHelper.prototype.retrievePost = async function(SymKey_Buyer){

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

PostHelper.prototype.retrievePost = async function(SymKey_Buyer){
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
