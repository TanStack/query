const data = []

function shouldFail() {
  return Math.random() > 0.7
}

export default (req, res) => {
  if (req.method === 'POST') {
    const body = JSON.parse(req.body)

    // sometimes it will fail, this will cause a regression on the UI

    if (shouldFail()) {
      throw new Error('Could not add item!')
    }

    data.push(body.text.toUpperCase())
    res.json(data)
    return
  }

  setTimeout(() => {
    res.json(data)
  }, 300)
}
