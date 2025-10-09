function getDefaultTitle(recipients) {
  if (!recipients.length) return ''
  const first = recipients[0]
  const match = first.match(/(.*)\s*<(.+)>/)
  return match ? match[1].trim() : first
}

function migrateOldConfigs(forwardingAddresses) {
  return forwardingAddresses.map(address => {
    const match = address.match(/(.*)\s*<(.+)>/)
    let name, recipients
    if (match) {
      name = ''
      recipients = [address]  // keep full for Thunderbird
    } else {
      name = ''
      recipients = [address]
    }
    return {
      name,
      recipients,
      fromIdentity: 'default',
      forwardType: 'inline',
      trashAfter: false
    }
  })
}