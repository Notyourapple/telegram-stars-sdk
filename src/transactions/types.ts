export interface ListTransactionsOptions {
  /**
   * Number of transactions to skip in the response.
   * Must be a non-negative integer.
   */
  offset?: number;

  /**
   * The maximum number of transactions to be retrieved.
   * Values between 1 and 100 are accepted. Defaults to 100.
   */
  limit?: number;

  signal?: AbortSignal;
}

export interface IterateTransactionsOptions {
  /**
   * Batch size per API call (1-100). Defaults to 100.
   */
  batchSize?: number;

  /**
   * Optional maximum total number of transactions to yield before stopping.
   */
  maxTransactions?: number;

  signal?: AbortSignal;
}
