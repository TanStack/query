import getNotionAssetUrls from '../../lib/notion/getNotionAssetUrls';
import { setHeaders, handleData, handleError } from '../../lib/notion/utils';
export default async function notionApi(req, res) {
  if (setHeaders(req, res)) return;

  try {
    const {
      assetUrl,
      blockId
    } = req.query;

    if (!assetUrl || !blockId) {
      handleData(res, {
        status: 'error',
        message: 'asset url or blockId missing'
      });
    } else {
      // we need to re-encode it since it's decoded when added to req.query
      const {
        signedUrls = [],
        ...urlsResponse
      } = await getNotionAssetUrls(res, assetUrl, blockId);

      if (signedUrls.length === 0) {
        console.error('Failed to get signedUrls', urlsResponse);
        return handleData(res, {
          status: 'error',
          message: 'Failed to get asset URL'
        });
      }

      res.status(307);
      res.setHeader('Location', signedUrls.pop());
      res.end();
    }
  } catch (error) {
    handleError(res, error);
  }
}