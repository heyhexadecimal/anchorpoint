'use client';

import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import * as anchor from '@coral-xyz/anchor';
import idl from '../../lib/idl.json';
import { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
import { PublicKey } from '@solana/web3.js';

export default function CounterPage() {
    const { connection } = useConnection();
    const { publicKey, wallet } = useWallet();
    const [program, setProgram] = useState<Program<Idl>>();
    const [counterValue, setCounterValue] = useState<number | null>(null);
    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [tokenAccounts, setTokenAccounts] = useState<any[]>([]);

    useEffect(() => {
        if (!publicKey || !wallet?.adapter) return;

        const provider = new AnchorProvider(
            connection,
            wallet.adapter as Wallet,
            {
                commitment: 'confirmed',
                preflightCommitment: 'confirmed',
            }
        );

        anchor.setProvider(provider);
        const program = new Program(idl as unknown as Idl, provider);
        setProgram(program);
    }, [publicKey, connection]);

    const fetchCounterState = async () => {
        if (!program) return;

        const [globalCounterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("counter")],
            program.programId
        );

        try {
            const counterAccount = await program.account.globalCounter.fetch(globalCounterPDA);
            setCounterValue(Number(counterAccount.count));
        } catch (e) {
            console.error("Failed to fetch counter:", e);
        }
    }

    useEffect(() => {
        fetchCounterState()
    }, [program]);

    useEffect(() => {
        (async () => {
            if (!publicKey) return;

            try {
                const balance = await connection.getBalance(publicKey);
                setSolBalance(balance / 1e9);

                const { value } = await connection.getParsedTokenAccountsByOwner(publicKey, {
                    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
                });

                const tokens = value.map(({ account }) => {
                    const data = account.data.parsed.info;
                    return {
                        mint: data.mint,
                        amount: data.tokenAmount.uiAmount,
                        decimals: data.tokenAmount.decimals,
                    };
                });

                setTokenAccounts(tokens);
            } catch (e) {
                console.error("Failed to fetch wallet info:", e);
            }
        })();
    }, [publicKey]);


    const handleIncrement = async () => {
        if (!program || !publicKey) return;

        const [globalCounterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("counter")],
            program.programId
        );

        try {
            await program.methods.increment().accounts({
                globalCounter: globalCounterPDA
            }).rpc();

            fetchCounterState()
        } catch (e) {
            console.error("Increment failed:", e);
        }
    };

    return (
        <div className="p-6 max-w-xl mx-auto space-y-4">
            <h1 className="text-xl font-bold">Anchor Program Counter</h1>
            <p><strong>Counter:</strong> {counterValue !== null ? counterValue : 'Loading...'}</p>

            <h2 className="text-xl font-bold mt-6">Wallet Info</h2>
            <p><strong>Wallet Address:</strong> {publicKey?.toBase58() ?? 'Not Connected'}</p>
            <p><strong>SOL Balance:</strong> {solBalance !== null ? `${solBalance} SOL` : 'Loading...'}</p>

            <h2 className="text-xl font-bold mt-6">SPL Tokens</h2>
            {tokenAccounts.length === 0 ? (
                <p>No tokens found</p>
            ) : (
                <ul className="list-disc list-inside space-y-2">
                    {tokenAccounts.map((token, idx) => (
                        <li key={idx}>
                            <strong>Mint:</strong> {token.mint}<br />
                            <strong>Amount:</strong> {token.amount}
                        </li>
                    ))}
                </ul>
            )}

            <button
                onClick={handleIncrement}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Increment Counter
            </button>
        </div>
    );
}