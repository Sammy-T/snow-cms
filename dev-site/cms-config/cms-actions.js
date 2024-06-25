/**
 * Triggered when a post is successfully saved
 * @param {*} doc - The post's data
 */
async function onSave(doc) {
    console.log(`CMS Action 'on save'`, doc);
}

/**
 * Triggered when posts are sucessfully deleted
 * @param {Array} docs - The deleted posts' data
 */
async function onDelete(docs) {
    console.log(`CMS Action 'on delete'`, docs);
}

/**
 * Triggered before logging out
 */
async function onLogout() {
    console.log(`CMS Action 'on logout'`);
}

/**
 * Specifies which actions to export.
 */
const actions = {
    onSave,
    // onDelete,
    // onLogout
};

export default actions;
