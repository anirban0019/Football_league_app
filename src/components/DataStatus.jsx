export default function DataStatus({ loading, error, empty, emptyMessage = "No data yet." }) {
  if (error) return <p role="alert">{error}</p>;
  if (loading) return <p role="status">Loading...</p>;
  if (empty) return <p role="status">{emptyMessage}</p>;
  return null;
}
