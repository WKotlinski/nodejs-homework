const fs = require("fs/promises");
const path = require("path");
const contactPath = path.join(__dirname, "./contacts.json");

const listContacts = async () => {
  const data = await fs.readFile(contactPath, "utf8");
  return JSON.parse(data);
};

const getContactById = async (contactId) => {
  const contacts = listContacts();
  return contacts.find((contact) => contact.id === contactId);
};

const removeContact = async (contactId) => {
  const contacts = await listContacts();
  const newContacts = contacts.filter((contact) => contact.id !== contactId);
  await fs.writeFile(contactPath, JSON.stringify(newContacts, null, 2));
  return newContacts;
};

const addContact = async (body) => {
  const contacts = await listContacts();
  const newContact = { id: contacts.length + 1, ...body };
  contacts.push(newContact);
};

const updateContact = async (contactId, body) => {
  const contacts = await listContacts();
  const index = contacts.findIndex((contact) => contact.is === contactId);
  if (index === -1) {
    return null;
  }
  const updatingCon = { ...contacts[index], ...body };
  contacts[index] = updatingCon;
  await fs.writeFile(contactPath, JSON.stringify(contacts, null, 2));
  return updatingCon;
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};
