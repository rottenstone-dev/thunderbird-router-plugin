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
    message.innerHTML = 'No forwarding configurations exist! <a href="#" onclick="browser.runtime.openOptionsPage(); window.close();">Create in settings</a>'
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
        document.getElementById('error').innerText = `Sending message failed! ${e}`
      }
    })
    document.getElementById('configs').appendChild(option)
  }
}

document.addEventListener('DOMContentLoaded', buildConfigsList)
