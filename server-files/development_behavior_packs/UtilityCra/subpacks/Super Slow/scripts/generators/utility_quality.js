export { setQuality }

function setQuality(block) {
    if (block.permutation.getState('twm:refreshSpeed') != 40) {
        block.setPermutation(block.permutation.withState('twm:refreshSpeed', 40))
    }
}