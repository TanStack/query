import getPageData from '../../lib/notion/getPageData';
import getBlogIndex from '../../lib/notion/getBlogIndex';
import { getBlogLink } from '../../lib/blog-helpers';
export default (async (req, res) => {
  if (typeof req.query.token !== 'string') {
    return res.status(401).json({
      message: 'invalid token'
    });
  }

  if (req.query.token !== process.env.NOTION_TOKEN) {
    return res.status(404).json({
      message: 'not authorized'
    });
  }

  if (typeof req.query.slug !== 'string') {
    return res.status(401).json({
      message: 'invalid slug'
    });
  }

  const postsTable = await getBlogIndex();
  const post = postsTable[req.query.slug];

  if (!post) {
    console.log(`Failed to find post for slug: ${req.query.slug}`);
    return {
      props: {
        redirect: '/blog'
      },
      revalidate: 5
    };
  }

  const postData = await getPageData(post.id);

  if (!postData) {
    return res.status(401).json({
      message: 'Invalid slug'
    });
  }

  res.setPreviewData({});
  res.writeHead(307, {
    Location: getBlogLink(post.Slug)
  });
  res.end();
});