"use client"

import { Connection, clusterApiUrl, Keypair } from "@solana/web3.js"
import { useState } from "react";
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    getAccount,
} from '@solana/spl-token';
import bs58 from "bs58";

const secret = "ogpAF4m9s1r5ZqGfL5mDkamsiNiXfd4xwaYkPoBL345rHk2iKiwRXFSE7oqALrj3kMZdDNV4TDxTQPCRiFvHNDL";
const secretKey = bs58.decode(secret);

const payer = Keypair.fromSecretKey(secretKey);


export default function Page() {

    const [mintAddress, setMindAddress] = useState("");
    const [tokenBalance, setTokenBalance] = useState(0);


    const createAndMintToken = async () => {
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        const fromWallet = payer;

        // const airdropSig = await connection.requestAirdrop(fromWallet.publicKey, 1e9); // 1 SOL
        // await connection.confirmTransaction(airdropSig);

        const mint = await createMint(
            connection,
            fromWallet,
            fromWallet.publicKey,
            null,
            6
        )

        setMindAddress(mint.toBase58());

        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            fromWallet,
            mint,
            fromWallet.publicKey,
        )

        await mintTo(
            connection,
            fromWallet,
            mint,
            tokenAccount.address,
            fromWallet.publicKey,
            10 * 10 ** 6

        )


        const accountInfo = await getAccount(connection, tokenAccount.address);
        setTokenBalance(Number(accountInfo.amount) / 10 ** 6)


    }

    return (
        <div className="p-6 max-w-lg mx-auto">
            <button
                onClick={createAndMintToken}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
                Create and Mint SPL Token
            </button>

            {mintAddress && (
                <div className="mt-4">
                    <p><strong>Mint Address:</strong> {mintAddress}</p>
                    <p><strong>Token Balance:</strong> {tokenBalance}</p>
                </div>
            )}
        </div>
    )
}