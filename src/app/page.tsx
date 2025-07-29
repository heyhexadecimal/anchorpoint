"use client"

import { ConnectionProvider, useConnection, useWallet, WalletProvider } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useState } from "react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

export const WalletConnectButton = () => {
  const { connect, select, connected, disconnect, publicKey } = useWallet();
  const [recieverAddress, setRecieverAddress] = useState("");
  const [amount, setAmount] = useState(0);
  const { connection } = useConnection()
  const [sol, setSol] = useState(0);
  const [laoding, setLoading] = useState(false);
  const [signature, setSignature] = useState("");
  const [popUpMessage, setPopUpMessage] = useState("");
  const [error, setError] = useState("");

  const handleButtonClick = async () => {
    try {
      setLoading(true);
      if (connected) {
        await disconnect();
      } else {
        await connect();
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const requestAirdrop = async () => {
    if (publicKey) {
      try {
        await connection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL)
        await fetchBalance();

      } catch (error) {
        console.log(error)
      }

    }
  }

  const fetchBalance = async () => {
    if (publicKey) {
      const lamports = await connection.getBalance(publicKey);
      setSol(lamports / 1e9);
    }
  }

  useEffect(() => {
    select('Phantom' as any)
    if (connected) {
      fetchBalance();
    }
  }, [connected])


  const sendSol = async () => {
    try {
      setLoading(true);
      setSignature("");
      if (!publicKey) return;
      const recipientPubKey = new PublicKey(recieverAddress);
      const lamports = parseFloat(amount?.toString()) * LAMPORTS_PER_SOL;
      const transaction = new Transaction()?.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubKey,
          lamports: lamports
        })
      )

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;


      // @ts-ignore
      const { signTransaction } = window.solana;
      if (!signTransaction) setError("Wallet not connected");

      const signed = await signTransaction(transaction);
      const transactionId = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(transactionId, "confirmed");
      setSignature(transactionId);
      setPopUpMessage("Transaction successful!");

    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setError("");
        setPopUpMessage("");
      }, 5000)
    }
  }

  return (
    <div className="w-full h-screen flex flex-col gap-4 items-center justify-center">

      {popUpMessage && <div className="w-160 font-bold bg-green-100 text-green-700 rounded-lg px-6 py-2 flex items-center justify-center text-lg capitalize" >
        {popUpMessage}
      </div>}
      {
        error &&
        <div className="w-160 font-bold bg-red-100 text-red-700 rounded-lg px-6 py-2 flex items-center justify-center text-lg capitalize" >
          {error}
        </div>

      }
      {
        signature &&
        <div className="w-160 font-bold bg-blue-100 text-blue-700 rounded-lg px-6 py-2 flex items-center justify-center text-lg capitalize" >
          {signature}
        </div>

      }

      <div className="flex" >
        <div className="w-80 gap-2 rounded-r-none aspect-square rounded-md border bg:border-white border-black flex flex-col items-center justify-center">
          <div className="p-4">
            Balance: {sol.toFixed(4)} SOL
          </div>
          <button onClick={handleButtonClick} className="bg-blue-500 w-48 cursor-pointer px-4 py-2 rounded-md">
            {

              connected
                ?
                `Disconnect ${publicKey?.toBase58()?.slice(0, 4)}...`
                :
                "Connect Wallet"

            }
          </button>
          <button onClick={requestAirdrop} className="border-blue-500 w-48 border cursor-pointer px-4 py-2 rounded-md">
            Airdrop
          </button>
        </div>
        <div className={`${!connected ? "hidden" : "flex"} w-80 transition-all gap-2 rounded-l-none aspect-square rounded-md border border-l-0 bg:border-white border-black flex flex-col items-center justify-center`}>

          <input value={recieverAddress} onChange={(e) => setRecieverAddress(e.target.value)} placeholder="Reciever Address " type="text" className="w-48 px-4 py-2 rounded-lg border border-blue-500" />
          <input value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Amount  " type="text" className="w-48 px-4 py-2 rounded-lg border border-blue-500" />

          <button disabled={!recieverAddress || !amount} onClick={sendSol} className={` w-48  px-4 py-2 rounded-md ${!recieverAddress || !amount ? "cursor-not-allowed bg-blue-400" : "cursor-pointer bg-blue-500"}`}>
            {
              laoding
                ?
                <div>Sending...</div>
                :
                <span>Send</span>
            }
          </button>

        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const endPoint = useMemo(() => clusterApiUrl('devnet'), [])
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [])
  return (
    <WalletConnectButton />
  );
}
