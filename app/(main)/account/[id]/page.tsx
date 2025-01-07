import { getAccountWithTransaction } from "@/actions/accounts";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";
import { BarLoader } from "react-spinners";
import TransactionTable from "../_components/transaction-table";
import AccountChart from "../_components/AccountChart";

type AccountPageParamType = {
  id: string;
};

type AccountPageProps = {
  params: AccountPageParamType;
};

const AccountPage: React.FC<AccountPageProps> = async ({ params }) => {
  const accountData = await getAccountWithTransaction(params.id);

  if (!accountData) {
    notFound();
  }

  const { transactions, ...account } = accountData;

  return (
    <div className="space-y-8 py-5">
      <div className="flex gap-4 items-end justify-between">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bol gradient-title capitalize">
            {account.name}
          </h1>
          <p className="text-muted-foreground">
            {" "}
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()}{" "}
            Account
          </p>
        </div>

        <div className="text-right pb-2">
          <div className="text-xl sm:text-2xl font-bold">
            ${parseFloat(account.balance.toString()).toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            {account._count.transactions} Transactions
          </p>
        </div>
      </div>

      {/* Chart sections */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <AccountChart transactions={transactions} />
      </Suspense>

      {/* Transciton table */}

      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <TransactionTable transactions={transactions} />
      </Suspense>
    </div>
  );
};

export default AccountPage;
