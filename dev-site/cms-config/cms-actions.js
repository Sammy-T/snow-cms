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
 * Overrides the default `logout` behavior
 * when the navbar's `exit` item is clicked.
 * 
 * If this function is not included in the export,
 * the CMS will default to `back` navigation.
 */
function logout() {
    console.log(`CMS Action 'logout'`);
}

/**
 * Specifies which actions to export.
 */
const actions = {
    onSave,
    // onDelete,
    // logout
};

export default actions;
