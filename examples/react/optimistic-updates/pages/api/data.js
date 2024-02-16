const items = []

export default async (req, res) => {
  await new Promise(r => setTimeout(r, 1000))

  if (req.method === 'POST') {
    const { text } = req.body

    // sometimes it will fail, this will cause a regression on the UI

    if (Math.random() > 0.7) {
      res.status(500)
      res.json({ message: 'Could not add item!' })
      return
    }

    items.push(text.toUpperCase())
    res.json(text.toUpperCase())
    return
  } else {
    res.json({
      ts: Date.now(),
      items,
    })
  }
}
