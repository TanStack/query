// an endpoint for getting user info
export default (req, res) => {
  if (req.cookies['swr-test-token'] === 'swr') {
    // authorized
    res.json({
      loggedIn: true,
      name: 'Tanner',
      avatar: 'https://github.com/tannerlinsley.png',
    })
    return
  }

  res.json({
    loggedIn: false,
  })
}
