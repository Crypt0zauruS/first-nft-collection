import { providers, Contract, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useState, useRef } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

function Home() {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // presaleStarted keeps track of whether the presale has started or not
  const [presaleStarted, setPresaleStarted] = useState(false);
  // presaleEnded keeps track of whether the presale ended
  const [presaleEnded, setPresaleEnded] = useState(false);
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);
  // checks if the currently connected MetaMask wallet is the owner of the contract
  const [isOwner, setIsOwner] = useState(false);
  // tokenIdsMinted keeps track of the number of tokenIds that have been minted
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();

  // presale mint

  const presaleMint = async () => {
    try {
      // Get the signer from the Web3 Modal, mandatory for 'write' transactions
      const signer = await getProviderOrSiger(true);
      // instantiate contract with the signer
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // call the presaleMint function on the contract
      const tx = await nftContract.presaleMint({
        // parsing the value string
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("You have successfully minted a Crypto Dev !");
    } catch (error) {
      console.log(error);
      window.alert("Something went wrong !");
    }
  };

  const publicMint = async () => {
    try {
      // Get the signer from the Web3 Modal, mandatory for 'write' transactions
      const signer = await getProviderOrSiger(true);
      // instantiate contract with the signer
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // call the presaleMint function on the contract
      const tx = await nftContract.mint({
        // parsing the value string
        value: utils.parseEther("0.02"),
      });
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("You have successfully minted a Crypto Dev !");
    } catch (error) {
      console.log(error);
      window.alert("Something went wrong !");
    }
  };

  // connect metamask
  const connectWallet = async () => {
    try {
      // Get the provider from web3modal, which is metamask
      // no need to be true, because we are not writing to the blockchain
      await getProviderOrSiger();
      setWalletConnected(true);
    } catch (error) {
      console.log(error);
    }
  };

  // start presale
  const startPresale = async () => {
    try {
      // Get the signer from the Web3 Modal, mandatory for 'write' transactions
      const signer = await getProviderOrSiger(true);
      // instantiate contract with the signer
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // call the startPresale function on the contract
      const tx = await nftContract.startPresale();
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      await checkIfPresaleStarted();
    } catch (error) {
      console.log(error);
    }
  };

  // check if presale started
  const checkIfPresaleStarted = async () => {
    try {
      // Get the provider from the Web3 Modal
      // no need the signer to be true, we don't write here
      const provider = await getProviderOrSiger();
      // instantiate contract with the provider
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the presaleStarted function on the contract
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  // check if presale ended
  const checkIfPresaleEnded = async () => {
    try {
      // Get the provider from the Web3 Modal
      // no need the signer to be true, we don't write here
      const provider = await getProviderOrSiger();
      // instantiate contract with the provider
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the presaleEnded function on the contract
      const _presaleEnded = await nftContract.presaleEnded();
      // _presaleEnded is a Big Number, so we are using the lt(less than function) instead of `<`
      // Date.now()/1000 returns the current time in seconds
      // We compare if the _presaleEnded timestamp is less than the current time
      // which means presale has ended
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  // get owner of the contract by calling the owner function of openzeppelin Ownable.sol
  const getOwner = async () => {
    try {
      // Get the provider from the Web3 Modal
      // no need the signer to be true, we don't write here
      const provider = await getProviderOrSiger();
      // instantiate contract with the provider
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the owner function on the contract
      const _owner = await nftContract.owner();
      // Get the signer from the Web3 Modal to extract the address of the currently connected MetaMask account
      const signer = await getProviderOrSiger(true);
      // check if the owner of the contract is the currently connected MetaMask account
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  // get the number of minted tokens
  const getTokensIdsMinted = async () => {
    try {
      // Get the provider from the Web3 Modal
      // no need the signer to be true, we don't write here
      const provider = await getProviderOrSiger();
      // instantiate contract with the provider
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the tokenIds from the contract
      const _tokenIds = await nftContract.tokenIds();
      // _tokenIds is a big number, conversion to string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (error) {
      console.error(error);
    }
  };

  /* A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain,
   * which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API
   * to allow your website to request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */

  const getProviderOrSiger = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a REF, we need to access the `current` value to get access to
    //the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3provider = new providers.Web3Provider(provider);
    // If user is not connected to the Goerli network, let them know and throw an error
    const { chainId } = await web3provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Please connect to the Goerli test network");
      throw new Error("Please connect to the Goerli test network");
    }
    // If we need the signer, return the signer
    if (needSigner) {
      const signer = web3provider.getSigner();
      return signer;
    }
    // Otherwise, return the provider
    return web3provider;
  };

  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect to Metamask
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providersOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      // check if presale started and ended
      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted) {
        checkIfPresaleEnded();
      }

      // get the number of minted tokens
      getTokensIdsMinted();

      // set an interval every 5 seconds to check if presale has ended
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5000);
    }
  }, [walletConnected]);

  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button className={styles.button} onClick={connectWallet}>
          Connect Your Wallet
        </button>
      );
    }

    if (loading) return <button className={styles.button}>loading...</button>;

    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale !
        </button>
      );
    }

    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale has not started</div>
        </div>
      );
    }

    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a Crypto
            Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint
          </button>
        </div>
      );
    }

    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint 🚀
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img
            className={styles.image}
            src="./cryptodevs/0.svg"
            alt="Crypto Devs NFT"
          />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}

export default Home;
