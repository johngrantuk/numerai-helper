
## Numerai Helper

[Erasure](https://erasure.xxx/) is a smart contract protocol developed by Numerai. It allows anybody to upload predictions, stake them with cryptocurrency, build a track record that everyone can verify and earn money. When posting a file to Erasure, a hash of the file is sent to Ethereum and an encrypted version of the file is stored (ideally in a decentralised manner). The hash builds reputation by proving you had the file at a given point in time. The encrypted file allows you to retrieve the file when a buyer shows interest.

Many traditional web developers may not have experience working with data hashes or encryption or know how to store that data in a decentralised manner using IPFS or 3Box. This Javascript helper library speeds of app development by abstracting away these complexities and allows the user to simply provide their raw data and select a storage method (IPFS or 3Box for now). The library handles encryption and storage and provides the various proof hashes and storage information the user requires to work with the Erasure protocol.

See [my post](https://medium.com/@johngrant/you-know-it-prove-it-3597040ca9ee) for more detail.

## To Use

To start simply copy the numerai-helper.js file to your app, import and create new helper with your desired app name (will be used for 3Box storage space) and eth address.

Packages required: 3Box, @erasure/crypto-ipfs, @pinata/sdk, axios.

```javascript
import NumeraiHelper from "./numerai-helper";

var helper = new NumeraiHelper('numerai', 'post_creator_eth_address');
```

### `savePost`

Creates required Post data from RawData, stores encrypted data and proof JSON using selected storage method and returns proof JSON, encrypted data, symmetric key, etc.

##### `NumeraiHelper.savePost()`
##### Params
* `RawData` - Raw data from creator.
* `StorageMethod` - 3Box or IPFS via Pinata. 3Box requires user to auth their space via signing method.
* `PinataApiKey` - Only for IPFS.
* `PinataApiSecret` - Only for IPFS.

##### Response
```
{
 proofJson: {
   creator,                               // Post creator eth address.
   salt,                                  // Required for Erasure
   datahash,                              // Hash of the raw data - can be used for confirmation
   encryptedDatahash,                     // This allows the encrypted data to be located on IPFS or 3Box
   keyhash                                // Hash of symmetricKey used for encryption - can be used for confirmation
 }
 proofhash,                               // Hash of proofJson - usually saved on chain by Erasure
 symmetricKey,                            // SymmetricKey used for encryption. For post creator to store.
 encryptedData                            // Encrypted data - used for storage.
};
```
##### Example Code
```javascript
componentDidMount = async () => {
  var helper = new NumeraiHelper('numerai', '0xEefc64D684A2dE1566b9A3368150cC882aA0B683');

  var postData = await helper.savePost('test create post', '3Box');
  console.log('App postData: ')
  console.log(postData)
}
```

### `retrievePost`

Retrieves encrypted data from selected storage method, decrypts and checks against hash..

##### `NumeraiHelper.retrievePost()`
##### Params
* `JsonHash` - Hash of proofJson - normally retrieved from On-Chain.
* `SymmetricKey` - SymmetricKey used to decrypt data.
* `StorageMethod` - StorageMethod 3Box or IPFS via Pinata.

##### Response
```
{
  rawData: rawMessage,          // Unecrypted data
  hashCheck: hashCheck          // True if matches data hash from JSON proof
}
```
##### Example Code
```javascript
// The following hashes and keys will return real data
componentDidMount = async () => {
  var helper = new NumeraiHelper('numerai', '0xEefc64D684A2dE1566b9A3368150cC882aA0B683');

  var proofhash = "QmbWoX2GicQmm5mvxsTssaJhhsJh8thS12aenUWHFfynbH";     // For 3Box
  var symKey = "am1ObmFkV1pPdEJCMkVkVU56QkM2YTMwZWltYm5OUFc=";
  //var proofhash = "QmZvESdPkNeLJVRYHVuE1ZTX2zroXYZ6mfAYRpmsBu8ruF";   // For IPFS IPFS
  //var symKey = "UXhGMUhjTkdiUDE3VzZoQUJlTjlTSE13RkpBeGYxY24=";
  var postData = await helper.retrievePost(proofhash, symKey, '3Box');
  console.log(postData);
}
```

### Storage Information

Currently the helper supports IPFS pinning (using Pinata) and 3Box storage. Both proofJson and encryptedData are stored during savePost using the [Content Identifiers](https://docs.ipfs.io/guides/concepts/cid/) as the address.

### `3Box`

With 3Box the data is stored in the users Public Space to allow access without authentication. Data is saved under the 3Box key-value data space specified when the helper is first used where the key is the computed Content Identifier.

```
Public Space
  SpaceName (i.e. numerai)
    key: value
    QmbWoX2GicQmm5mvxsTssaJhhsJh8thS12aenUWHFfynbH: '{"creator":"0xEefc64D684A2dE1566b9A3368150cC882aA0B683","salt":{"0":169,"1":153,"2":231,"3":75,"4":1,"5":121,"6":13,"7":74,"8":137,"9":117,"10":214,"11":219,"12":28,"13":170,"14":51,"15":213,"16":205,"17":84,"18":179,"19":57,"20":150,"21":149,"22":193,"23":166},"datahash":"0x1220dd02430fe031c4289937e96bc25e59031e7b01d5739b7221df30c7fe9da4012d","encryptedDatahash":"QmPWN48qeMqStYv84BJbJL45QB5KBBUmghYMRDeYtfZN8q","keyhash":"0x122048df5f58947d70dc96da06d0a9bb3fc9cbd4fa5c39ce5f801da266c07259ab09"}'


```

## To Do

* Make a proper npm module.

* Add Smart Contract functions:

It took me a while to get my head around the data requirements for interacting with Erasure (hence this library) but I can see how the work completed so far could naturally be built upon by adding the smart contract functionality, see examples below.

Buying/Reveal:
* Get EncSymKey from Griefing contract.
* Decrypt SymKey
* Confirm SymKey hash is correct. -- DONE
* Get Encrypted data from storage.-- DONE
* Decrypt data.                   -- DONE
* Confirm data hash.              -- DONE

Add Selling Flow:
* Seller create Post to sell -- DONE
* Encrypt SymKey with BuyerPubKey
* Submit EncSymKey to Griefing contract.
