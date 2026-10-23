// Two simultaneous "create if missing" writes can both try to insert. The loser gets a
// duplicate-key error, and running the operation once more finds the winner's document.
export async function retryOnDuplicateKey(operation) {
  try {
    return await operation();
  } catch (err) {
    if (err.code !== 11000) throw err;
    return await operation();
  }
}