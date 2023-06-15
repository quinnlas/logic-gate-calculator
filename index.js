// output on the left (only single output is supported)
// for multiple outputs you could make a gate per and duplicate the inputs
const truthTable = [
  [0, 0, 0],
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 1],
]

const numInputs = truthTable[0].length - 1

// the algorithm we use is:
// find the input combinations that give a true output
// for each of these, we will create an AND gate with n inputs
// the input to the AND gate will be negated if the corresponding input in the combination is 0
// essentially, when the gate has any correct input, exactly one of these AND gates will output 1
// therefore, we just OR them together to finish the gate
const trueInputs = truthTable
  .filter(row => row[numInputs] === 1)
  .map(row => row.slice(0, -1))

// we will put each AND gate on a separate vertical floor in the minecraft gate
// then we will transmit the outputs to the ground floor before ORing together
const minecraftBlocks = []

// TODO torch and repeater orientation
const blockStr = 'block'
const wireStr = 'wire'
const torchStr = 'torch'
const repeaterStr = 'repeater'
const lampStr = 'lamp'

// add the floors from the bottom up
// just the AND gates and upward signal transmission for now
trueInputs.forEach((inputCombo, inputComboIndex) => {
  // the bottom level of each floor is just the "floor," some blocks to hold the wires leading into the AND gate
  // and the incoming transmission from the previous floor
  const onBottomFloor = inputComboIndex === 0
  minecraftBlocks.push(
    inputCombo
      .map(i => [
        [onBottomFloor ? null : torchStr, blockStr, blockStr],
        []
      ])
      .flat()
      .slice(0, -1)
  )

  // 2nd from the bottom (inputs to AND gate and bottom layer of AND gate)
  const secondLayer = inputCombo
    .map(i => [
      [blockStr, i ? wireStr : torchStr, wireStr, blockStr, blockStr],
      [null, null, null, null, blockStr]
    ])
    .flat()
    .slice(0, -1)
  secondLayer[secondLayer.length - 1].push(torchStr) // the torch at the end of the AND gate
  minecraftBlocks.push(secondLayer)

  // 3rd from the bottom (top of AND gate, vertical transmission)
  const onTopFloor = inputComboIndex === trueInputs.length - 1
  minecraftBlocks.push(
    inputCombo.map(i => [
      [onTopFloor ? null : torchStr, null, null, torchStr, wireStr],
      [null, null, null, null, repeaterStr]
    ])
    .flat()
    .slice(0, -1)
  )

  // 4th layer (not for top floor), just blocks for the vertical transmission
  if (!onTopFloor) {
    minecraftBlocks.push(
      inputCombo.map(i => [
        [blockStr],
        []
      ])
      .flat()
      .slice(0, -1)
    )
  }
})

// downward transmission
trueInputs.forEach((inputCombo, inputComboIndex) => {
  // a "step" is a block with wire on top and a torch on the right
  const neededSteps = inputComboIndex * 2
  for (let stepIndex = 0; stepIndex < neededSteps; stepIndex++) {
    // determine the 2 layers of this step
    // we will build these from the bottom up
    // so step 0 would be at layers 1 and 2 etc
    const bottomLayerIndex = stepIndex * 2 + 1

    // which row? we want the last row of the AND gate
    // which should be based on the number of inputs
    const rowIndex = numInputs * 2 - 2

    // now we need the distance to the right
    // inputCombo 0 doesn't have downward transmission
    // inputCombo 1 would be at index 6 for step 0, index 5 for step 1 etc
    // inputCombo 2 would be at index 8 for step 0, index 7 for step 1 etc
    const step0RightIndex = (inputComboIndex * 2 + 4)
    const rightIndex = step0RightIndex - stepIndex

    // now add the 3 blocks (both indices correspond to the "block" part of the step)
    minecraftBlocks[bottomLayerIndex][rowIndex][rightIndex] = blockStr
    minecraftBlocks[bottomLayerIndex][rowIndex][rightIndex + 1] = torchStr
    minecraftBlocks[bottomLayerIndex + 1][rowIndex][rightIndex] = wireStr
  }
})

// add the final OR gate on the bottom
minecraftBlocks[0].push([
  null, null, null, null, null, 
  ...trueInputs.map(i => [blockStr, null]).flat().slice(0, -1)
])
minecraftBlocks[0].push([null, blockStr, blockStr, blockStr, blockStr])
minecraftBlocks[1].push([
  null, null, null, null, null, 
  ...trueInputs.map(i => [wireStr, null]).flat().slice(0, -1)
])
minecraftBlocks[1].push([
  lampStr, wireStr, wireStr, wireStr, wireStr,
  ...trueInputs.map(i => [blockStr, blockStr]).flat().slice(0, -1)
])
minecraftBlocks[2].push([])
minecraftBlocks[2].push([
  null, null, null, null, null, 
  ...trueInputs.map(i => [wireStr, repeaterStr]).flat().slice(0, -1)
])

// fills empty indices with undefined so that array iteration methods work as expected
// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections#sparse_arrays
function desparseArray(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = arr[i] // empty indices return undefined if accessed like this
  }
}

// logs the blocks one layer at a time
function displayBlocks(blocks) {
  blocks.forEach((layer, layerIndex) => {
    console.log(`Layer ${layerIndex + 1}`)
    layer.forEach(row => {
      // if the rows were left sparse, map would not work as expected
      desparseArray(row)
      console.log(row.map(blockStr => (blockStr || ' ')[0]).join(''))
    })
    console.log()
  })
}

displayBlocks(minecraftBlocks)
// TODO convert to schematic so it can be imported into the game
// TODO break into modules