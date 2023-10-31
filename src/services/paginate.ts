export const getPaginationMeta = (params: {
  totalQueryCount: number;
  totalResultCount: number;
  from: number;
  limit: number;
}) => {
  const divisor =
    params.totalQueryCount === params.limit
      ? params.totalResultCount
      : params.limit;
  return {
    firstPage: params.totalResultCount > 0 ? 1 : 0,
    total: params.totalQueryCount,
    lastPage: Math.ceil(params.totalQueryCount / divisor),
    from: params.totalResultCount > 0 ? params.from + 1 : 0,
    to: params.from + params.totalResultCount,
  };
};
