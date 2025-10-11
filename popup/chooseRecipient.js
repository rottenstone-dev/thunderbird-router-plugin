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

async function buildConfigsList () {
  const { forwardingConfigs } = await browser.storage.local.get({ forwardingConfigs: [] })

  if (!forwardingConfigs.length) {
    const message = document.createElement('p')
    message.textContent = 'No forwarding configurations exist! '
    const link = document.createElement('a')
    link.href = '#'
    link.onclick = () => { browser.runtime.openOptionsPage(); window.close(); }
    link.textContent = 'Create in settings'
    message.appendChild(link)
    document.getElementById('configs').appendChild(message)
    document.getElementById('shiftInstruction').style.display = 'none'
    return
  }

  for (const config of forwardingConfigs) {
    const option = document.createElement('button')
    const displayTitle = config.name || getDefaultTitle(config.recipients)
    option.innerText = displayTitle
    option.title = `Recipients: ${config.recipients.join(', ')}\nFrom: ${config.fromIdentity}\nType: ${config.forwardType}\nTrash: ${config.trashAfter ? 'Yes' : 'No'}`
    option.addEventListener('click', e => {
      try {
        browser.runtime.sendMessage({ action: 'chooseRecipient', config, compose: e.shiftKey })
        window.close()
      } catch (e) {
        console.error(e)
        const errorDiv = document.getElementById('error')
        const redSpan = errorDiv.querySelector('span.red')
        redSpan.textContent = `Sending message failed! ${e}`
        errorDiv.dataset.view = 'red'
      }
    })
    document.getElementById('configs').appendChild(option)
  }
}

document.addEventListener('DOMContentLoaded', buildConfigsList)
