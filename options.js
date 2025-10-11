let identities = []
let radioGroupCounter = 0

async function loadIdentities() {
  const accounts = await browser.accounts.list()
  identities = []
  for (const account of accounts) {
    for (const identity of account.identities) {
      identities.push(identity.email)
    }
  }
  identities = [...new Set(identities)] // unique
}

function createConfigElement(config = {}) {
  const details = document.createElement('details')
  details.open = !config.recipients || !config.recipients.length // Open for new or empty configs

  const summary = document.createElement('summary')
  summary.style.display = 'flex'
  summary.style.alignItems = 'center'
  summary.style.justifyContent = 'space-between'
  summary.style.cursor = 'pointer'

  const arrowSpan = document.createElement('span')
  arrowSpan.textContent = details.open ? '▼' : '▶'
  arrowSpan.style.marginRight = '5px'
  summary.appendChild(arrowSpan)

  const titleSpan = document.createElement('span')
  const displayTitle = config.name || getDefaultTitle(config.recipients || []) || '(auto)'
  titleSpan.textContent = displayTitle
  titleSpan.style.fontWeight = 'bold'
  titleSpan.style.color = 'black'
  titleSpan.style.cursor = 'pointer'
  summary.appendChild(titleSpan)

  // Update arrow on toggle
  details.addEventListener('toggle', () => {
    arrowSpan.textContent = details.open ? '▼' : '▶'
  })

  const moveButtons = document.createElement('div')
  moveButtons.style.display = 'flex'
  moveButtons.style.gap = '2px'

  const upButton = document.createElement('button')
  upButton.textContent = '↑'
  upButton.title = 'Move up'
  upButton.style.fontSize = '10px'
  upButton.style.padding = '2px 4px'
  upButton.addEventListener('click', (e) => {
    e.stopPropagation() // Prevent toggling details
    const prev = details.previousElementSibling
    if (prev) {
      details.parentNode.insertBefore(details, prev)
    }
  })
  moveButtons.appendChild(upButton)

  const downButton = document.createElement('button')
  downButton.textContent = '↓'
  downButton.title = 'Move down'
  downButton.style.fontSize = '10px'
  downButton.style.padding = '2px 4px'
  downButton.addEventListener('click', (e) => {
    e.stopPropagation() // Prevent toggling details
    const next = details.nextElementSibling
    if (next) {
      details.parentNode.insertBefore(next, details)
    }
  })
  moveButtons.appendChild(downButton)

  summary.appendChild(moveButtons)

  details.appendChild(summary)

  const div = document.createElement('div')
  div.style.marginLeft = '20px'
  div.style.marginBottom = '10px'

  const nameLabel = document.createElement('label')
  nameLabel.textContent = 'Configuration Name: '
  const nameInput = document.createElement('input')
  nameInput.type = 'text'
  nameInput.name = 'name'
  nameInput.value = config.name || ''
  nameInput.placeholder = getDefaultTitle(config.recipients || []) || '(auto)'
  nameLabel.appendChild(nameInput)
  div.appendChild(nameLabel)
  div.appendChild(document.createElement('br'))

  const recipientsLabel = document.createElement('label')
  recipientsLabel.textContent = 'Recipients (one per line): '
  div.appendChild(recipientsLabel)
  div.appendChild(document.createElement('br'))
  const recipientsTextarea = document.createElement('textarea')
  recipientsTextarea.name = 'recipients'
  recipientsTextarea.value = (config.recipients || []).join('\n')
  div.appendChild(recipientsTextarea)
  div.appendChild(document.createElement('br'))

  // Update summary live
  const updateSummary = () => {
    const recipients = recipientsTextarea.value.split('\n').map(x => x.trim()).filter(x => x)
    const computed = getDefaultTitle(recipients)
    titleSpan.textContent = nameInput.value || computed || '(auto)'
    nameInput.placeholder = computed || '(auto)'
  }
  recipientsTextarea.addEventListener('input', updateSummary)
  nameInput.addEventListener('input', updateSummary)

  const fromLabel = document.createElement('label')
  fromLabel.textContent = 'From Identity: '
  const fromSelect = document.createElement('select')
  fromSelect.name = 'fromIdentity'
  const defaultOption = document.createElement('option')
  defaultOption.value = 'default'
  defaultOption.textContent = 'Default (based on received email)'
  fromSelect.appendChild(defaultOption)
  for (const email of identities) {
    const option = document.createElement('option')
    option.value = email
    option.textContent = email
    if (config.fromIdentity === email) option.selected = true
    fromSelect.appendChild(option)
  }
  fromLabel.appendChild(fromSelect)
  div.appendChild(fromLabel)
  div.appendChild(document.createElement('br'))

  const forwardTypeLabel = document.createElement('label')
  forwardTypeLabel.textContent = 'Forward Type: '
  const groupName = 'forwardType_' + radioGroupCounter++
  const inlineRadio = document.createElement('input')
  inlineRadio.type = 'radio'
  inlineRadio.name = groupName
  inlineRadio.value = 'inline'
  inlineRadio.checked = (config.forwardType || 'inline') === 'inline'
  forwardTypeLabel.appendChild(inlineRadio)
  forwardTypeLabel.appendChild(document.createTextNode(' Inline '))
  const attachmentRadio = document.createElement('input')
  attachmentRadio.type = 'radio'
  attachmentRadio.name = groupName
  attachmentRadio.value = 'attachment'
  attachmentRadio.checked = config.forwardType === 'attachment'
  forwardTypeLabel.appendChild(attachmentRadio)
  forwardTypeLabel.appendChild(document.createTextNode(' As Attachment '))
  div.appendChild(forwardTypeLabel)
  div.appendChild(document.createElement('br'))

  const trashLabel = document.createElement('label')
  trashLabel.textContent = 'Trash after forwarding: '
  const trashCheckbox = document.createElement('input')
  trashCheckbox.type = 'checkbox'
  trashCheckbox.name = 'trashAfter'
  trashCheckbox.checked = config.trashAfter || false
  trashLabel.appendChild(trashCheckbox)
  div.appendChild(trashLabel)
  div.appendChild(document.createElement('br'))

  const removeButton = document.createElement('button')
  removeButton.textContent = 'Remove'
  removeButton.addEventListener('click', () => details.remove())
  div.appendChild(removeButton)

  details.appendChild(div)

  return details
}

async function saveOptions() {
  try {
    const configs = []
    let hasEmptyRecipients = false
    for (const configDiv of document.querySelectorAll('details > div')) {
      const nameInput = configDiv.querySelector('input[name="name"]')
      const name = nameInput ? nameInput.value.trim() : ''
      const recipientsTextarea = configDiv.querySelector('textarea[name="recipients"]')
      const recipients = recipientsTextarea ? recipientsTextarea.value.split('\n').map(x => x.trim()).filter(x => x) : []
      const fromSelect = configDiv.querySelector('select[name="fromIdentity"]')
      const fromIdentity = fromSelect ? fromSelect.value : 'default'
      const forwardType = configDiv.querySelector('input[name*="forwardType_"][value="attachment"]:checked') ? 'attachment' : 'inline'
      const trashCheckbox = configDiv.querySelector('input[name="trashAfter"]')
      const trashAfter = trashCheckbox ? trashCheckbox.checked : false
      if (recipients.length) {
        configs.push({ name, recipients, fromIdentity, forwardType, trashAfter })
      } else {
        hasEmptyRecipients = true
      }
    }
    if (hasEmptyRecipients) {
      const errorDiv = document.getElementById('error')
      const redSpan = errorDiv.querySelector('span.red')
      redSpan.textContent = 'Some configurations have no recipients and were not saved!'
      errorDiv.dataset.view = 'red'
      return
    }
    await browser.storage.local.set({ forwardingConfigs: configs })

    document.getElementById('error').dataset.view = 'green'
  } catch (e) {
    console.error(e)
    const errorDiv = document.getElementById('error')
    const redSpan = errorDiv.querySelector('span.red')
    redSpan.textContent = `Saving options failed! ${e}`
    errorDiv.dataset.view = 'red'
  }
}

async function restoreOptions() {
  try {
    await loadIdentities()
    const { forwardingConfigs } = await browser.storage.local.get({ forwardingConfigs: [] })

    const configsContainer = document.getElementById('configs')
    while (configsContainer.firstChild) {
      configsContainer.removeChild(configsContainer.firstChild)
    }
    for (const config of forwardingConfigs) {
      configsContainer.appendChild(createConfigElement(config))
    }
    if (!forwardingConfigs.length) {
      configsContainer.appendChild(createConfigElement())
    }
  } catch (e) {
    console.error(e)
    const errorDiv = document.getElementById('error')
    const redSpan = errorDiv.querySelector('span.red')
    redSpan.textContent = `Loading options failed! ${e}`
    errorDiv.dataset.view = 'red'
  }
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.getElementById('save').addEventListener('click', saveOptions)
document.getElementById('addConfig').addEventListener('click', () => {
  document.getElementById('configs').appendChild(createConfigElement())
})
