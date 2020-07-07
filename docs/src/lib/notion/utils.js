export function setHeaders(req, res) {
  // set SPR/CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'pragma');

  if (req.method === 'OPTIONS') {
    res.status(200);
    res.end();
    return true;
  }

  return false;
}
export async function handleData(res, data) {
  data = data || {
    status: 'error',
    message: 'unhandled request'
  };
  res.status(data.status !== 'error' ? 200 : 500);
  res.json(data);
}
export function handleError(res, error) {
  console.error(error);
  res.status(500).json({
    status: 'error',
    message: 'an error occurred processing request'
  });
}