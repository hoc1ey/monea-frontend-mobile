/** Standard paginated payload returned by the `incomes` and `expenses` list endpoints. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
