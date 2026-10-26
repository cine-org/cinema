import { parseUsersQuery } from '../_data/users-query';
import { CustomersTable } from './_components/customers-table';
import { listCustomers } from './_data/mock-customers';

export const metadata = { title: 'Customers' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CustomersPage({ searchParams }: Props) {
  const query = parseUsersQuery(await searchParams);
  const { rows, total, page } = await listCustomers(query);

  return <CustomersTable query={{ ...query, page }} rows={rows} total={total} />;
}
