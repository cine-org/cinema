import { parseUsersQuery } from '../_data/users-query';
import { EmployeesTable } from './_components/employees-table';
import { listEmployees } from './_data/mock-employees';

export const metadata = { title: 'Employees' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function EmployeesPage({ searchParams }: Props) {
  const query = parseUsersQuery(await searchParams);
  const { rows, total, page } = await listEmployees(query);

  return <EmployeesTable query={{ ...query, page }} rows={rows} total={total} />;
}
