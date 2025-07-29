'use client';

import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import * as anchor from '@coral-xyz/anchor';
import idl from '../../lib/idl.json';
import { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
import { utf8 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';


export default function CounterPage() {
    const { connection } = useConnection();
    const { publicKey, wallet } = useWallet();
    const [program, setProgram] = useState<Program<Idl>>();

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
        console.log(program)
        //@ts-ignore
        setProgram(program);
    }, [publicKey, connection])

    useEffect(() => {
        (async () => {
            if (!program) return;

            const [globalCounterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
                [Buffer.from("counter")],
                program.programId
            );

            try {
                const counterAccount = await program.account.globalCounter.fetch(globalCounterPDA);
                console.log("Counter value:", counterAccount.count.toString());
            } catch (e) {
                console.error("Failed to fetch counter:", e);
            }
        })();
    }, [program]);


    return (
        <div className="p-6 max-w-xl mx-auto">
            LOL
        </div>
    );
}