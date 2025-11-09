// Function to shuffle an array
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

// --- Card Decks ---

// Green Apple Cards (Descriptions / Adjectives)
const greenCards = [
  "Absurd", "Adventurous", "Aggressive", "Ancient", "Annoying", "Awesome", "Awkward", "Beautiful", "Bizarre", "Boring",
  "Bright", "Brilliant", "Calm", "Charming", "Cheesy", "Clean", "Cold", "Colorful", "Comfortable", "Comical", "Complicated",
  "Confusing", "Cool", "Creepy", "Cruel", "Cuddly", "Cute", "Dangerous", "Dark", "Delicious", "Delightful", "Dirty",
  "Disgusting", "Dumb", "Eccentric", "Elegant", "Embarrassing", "Enormous", "Entertaining", "Evil", "Exciting", "Exhausting",
  "Expensive", "Explosive", "Fabulous", "Fancy", "Fantastic", "Fast", "Fluffy", "Fragile", "Fresh", "Friendly", "Frightening",
  "Funny", "Fuzzy", "Gentle", "Glamorous", "Glorious", "Good", "Goofy", "Graceful", "Gross", "Hairy", "Happy", "Harmful",
  "Heartbreaking", "Heart-warming", "Hilarious", "Honorable", "Horrible", "Hot", "Huge", "Humorous", "Important", "Incredible",
  "Infamous", "Innocent", "Inspiring", "Intelligent", "Intense", "Interesting", "Irritating", "Juicy", "Lazy", "Loud", "Lovely",
  "Lucky", "Magical", "Majestic", "Mean", "Messy", "Miserable", "Mushy", "Mysterious", "Nasty", "Naughty", "Noisy", "Odd",
  "Old", "Pathetic", "Patriotic", "Peaceful", "Perfect", "Playful", "Pleasant", "Popular", "Powerful", "Puffy", "Quick", "Quiet",
  "Quirky", "Relaxing", "Ridiculous", "Rough", "Rowdy", "Sad", "Salty", "Scary", "Sharp", "Shiny", "Shocking", "Short", "Shy",
  "Silent", "Silly", "Simple", "Sloppy", "Slow", "Small", "Smelly", "Smooth", "Soft", "Sparkling", "Spicy", "Spooky", "Stinky",
  "Strange", "Stressful", "Strong", "Stupid", "Stylish", "Surprising", "Sweet", "Tall", "Tame", "Tasty", "Tender", "Terrible",
  "Terrific", "Thrilling", "Tough", "Trendy", "Ugly", "Unbelievable", "Unforgettable", "Unhealthy", "Unusual", "Useless",
  "Warm", "Weak", "Weird", "Wild", "Wonderful", "Wacky", "Zany",

  "Adorable", "Backbreaking", "Bold", "Brainy", "Chaotic", "Cheerful", "Classy", "Clueless", "Comforting",
  "Confident", "Courageous", "Cringy", "Dangerous", "Deadly", "Defensive", "Determined", "Disastrous", "Dramatic",
  "Energetic", "Epic", "Fake", "Fearless", "Festive", "Futuristic", "Gloomy", "Grumpy", "Hopeful", "Hopeless", "Icy",
  "Immortal", "Impatient", "Insane", "Jealous", "Lazy", "Legendary", "Lonely", "Luminous", "Mediocre", "Melodramatic",
  "Microscopic", "Modern", "Mysterious", "Overrated", "Peaceful", "Philosophical", "Power-hungry", "Predictable",
  "Radiant", "Reliable", "Ridiculous", "Savage", "Shameless", "Sleepy", "Sour", "Suspicious", "Timid", "Toxic",
  "Unlucky", "Untouchable", "Vicious", "Witty", "Youthful"
];

// Red Apple Cards (Things / Nouns)
const redCards = [
  "A Wet Sock", "A Hairy Back", "Backwash", "Belly Button Lint", "Boogers", "Chewing with your mouth open",
  "Clammy Handshakes", "Cold, congealed gravy", "Dandruff", "Dead flies on a windowsill", "Dog slobber", "Earwax",
  "Eating chalk", "Eyeballs", "Expired milk", "Foot fungus", "Greasy hair", "Grandma's dentures", "Licking a 9-volt battery",
  "Litter box", "Moldy bread", "Mouthful of spiders", "Mucus", "Picking a scab", "Pus", "Roadkill", "Sardines", "Smelly feet",
  "Soggy cereal", "Spitballs", "Toenail clippings", "A public toilet seat", "Yellow snow", "Zits", "A broken phone charger",
  "A squeaky chair", "A traffic jam", "Assembly-required furniture", "Bad cell reception", "Bed bugs", "Cold showers",
  "Coupons", "Doing the dishes", "Dust bunnies", "Final exams", "Finding a penny", "Forgetting someone's name", "Homework",
  "Jury duty", "Losing your keys", "Loud neighbors", "Junk mail", "Monday mornings", "Mowing the lawn", "Oatmeal",
  "Paper cuts", "Paying bills", "Small talk", "Spam emails", "Stepping on a LEGO", "Stubbing your toe", "Taking out the trash",
  "That one sock that disappears", "Waiting in line", "Waking up before the alarm", "A crazy cat lady", "A guy with a man-bun",
  "A grumpy old man", "A psychic", "A street magician", "Baby Yoda", "Bob Ross", "Captain America", "Darth Vader", "Dracula",
  "Dwayne 'The Rock' Johnson", "Elon Musk", "Gollum", "Hulk", "Keanu Reeves", "My Dad's jokes", "Ninjas", "Pirates",
  "Santa Claus", "SpongeBob SquarePants", "Taylor Swift", "That one annoying relative", "The Kardashians", "The Queen of England",
  "Zombies", "A bouncy castle", "A high-five", "A water balloon fight", "Action movies", "Area 51", "Bad karaoke", "Bubble wrap",
  "Comic books", "Couch cushions", "Crying babies", "Disco balls", "Fancy hats", "Fanny packs", "Glitter", "Helium balloons",
  "Hula hoops", "Killer whales", "Lava lamps", "Memes", "My first car", "Pillow forts", "Popcorn", "Rubber ducks", "Scarecrows",
  "The 1990s", "The Bermuda Triangle", "TikTok dances", "Tinfoil hats", "Trampolines", "Water slides", "A Moldy Sandwich",
  "A Used Band-Aid", "A Watery Ketchup Bottle", "All-Nighters", "Angry Birds", "A Fart", "Bad Breath", "Bill Nye The Science Guy",
  "Body Odor", "Botox", "Boy Bands", "Broken Bones", "Brussels Sprouts", "Cardboard Boxes", "Chainsaws", "Cold Pizza", "Crying",
  "Double Rainbows", "Dr. Seuss", "Drool", "Eating Glue", "Eye Exams", "Fad Diets", "Fake Plants", "Family Photos", "Flea Markets",
  "Getting Lost", "Giant Zits", "Going Bald", "High School Reunions", "Hiccups", "Hospitals", "House Elves", "Karate", "Kazoos",
  "Knitting", "Limp Handshakes", "Mosquito Bites", "Nail Biting", "Photobombs", "Pinching", "Pranks", "Public Restrooms",
  "Puffy Coats", "Regifting", "Road Trips", "Rude People", "Rust", "Scabs", "Screaming", "Seaweed", "Senior Prom", "Shopping Carts",
  "Sinking Ships", "Speeding Tickets", "Sticky Fingers", "A Bad Hair Day", "A Bubble Bath", "A Desert Island", "A Good Book",
  "A Haunted House", "A Kiss", "A Lemon", "A Library", "A Lightning Bolt", "A Long Nap", "A Million Dollars", "A Parade", "A Party",
  "A Pirate Ship", "A Rainbow", "A Roller Coaster", "A Royal Wedding", "A Shooting Star", "A Snowball Fight", "A Sunrise",
  "A Supermodel", "A Surprise Party", "A Treehouse", "A Unicorn", "Abraham Lincoln", "Africa", "Albert Einstein", "Aliens",
  "Antarctica", "Apple Pie", "Astronauts", "Babe Ruth", "Babies", "Back To The Future", "Bacon", "Ballerinas", "Balloons",
  "Bananas", "Batman", "Beach Parties", "Bigfoot", "Billionaires", "Black Holes", "Blue Whales", "Board Games", "Bowling",
  "Bubble Gum", "Bunnies", "Butterflies", "Camping", "Canada", "Candy", "Car Wrecks", "Carnivals", "Cars", "Cartoons", "Cats",
  "Cavemen", "Celebrities", "Cell Phones", "Cheeseburgers", "Chocolate", "Christmas", "Clowns", "Coffee", "Computers", "Cookies",
  "Couch Potatoes", "Cowboys", "Crayons", "Daffy Duck", "Dentists", "Diamonds", "Dinosaurs", "Dirty Diapers", "Dirty Laundry",
  "Discos", "Disneyland", "Doctors", "Dogs", "Dolphins", "Dragons", "Drum Solos", "Dumbo", "Egypt", "Elephants", "Elves",
  "Elvis Presley", "Explosions", "Fairies", "Falling Down", "Family Reunions", "Fashion Models", "Fast Food", "Firefighters",
  "Fireworks", "Flip-flops", "Flowers", "Flying", "Football", "Fortnite", "Fortune Cookies", "France", "Frankenstein", "Freedom",
  "French Fries", "Frogs", "Garbage", "George Washington", "Ghosts", "Giraffes", "Glaciers", "Gold", "Goldfish", "Golf", "Grandma",
  "Grandpa", "Gummy Bears", "Hair Transplants", "Halloween", "Hammerhead Sharks", "Hamsters", "Harry Potter", "Hawaii", "Headaches",
  "Helicopters", "Homer Simpson", "Honey", "Hot Dogs", "Hot Tubs", "Ice Cream", "Icebergs", "Invisibility", "Jellyfish", "Jet Skis",
  "Junk Food", "Kangaroos", "Karaoke", "King Arthur", "King Kong", "Kittens", "Ladybugs", "Las Vegas", "Lawn Mowers", "Lawyers",
  "Lemonade", "Leonardo da Vinci", "Lions", "Lizards", "Lollipops", "Love Letters", "Magic", "Mark Twain", "Mars", "Marshmallows",
  "Michael Jackson", "Michael Jordan", "Mickey Mouse", "Milk & Cookies", "Mini-Vans", "Minecraft", "Money", "Monkeys", "Monsters",
  "Moon Walking", "Mosquitoes", "Mount Everest", "Mountain Biking", "Mr. Rogers", "Mud", "Mummies", "Muscles", "Mushrooms",
  "My Backyard", "My Family", "My Friends", "My Room", "My School", "NASCAR", "New York City", "Noah's Ark", "North Pole", "Opera",
  "Outer Space", "Owls", "Pancakes", "Peanut Butter & Jelly", "Penguins", "Piglets", "Pigs", "Pikachu", "Pilgrims", "Piranhas",
  "Pizza", "Plane Wrecks", "Poetry", "Poodles", "Popcorn", "Preachers", "Presidents", "Princes", "Princesses", "Pro Wrestling",
  "Pterodactyls", "Puppies", "Queen Elizabeth", "Rabbits", "Rain", "Rattlesnakes", "Red Roses", "Robots", "Rock 'n Roll",
  "Rockstars", "Saturday Morning Cartoons", "School", "Science", "Shakespeare", "Sharks", "Shrek", "Singing in the Shower",
  "Skateboards", "Skeletons", "Skunks", "Skydiving", "Slam Dunks", "Sleep", "Slippers", "S'mores", "Snails", "Snakes", "Snow",
  "Soccer", "Socks", "Squirrels", "Star Wars", "Statue of Liberty", "Storms", "Submarines", "Summer", "Summer Camp", "Superman",
  "Surfing", "Sushi", "Swamps", "T-Rex", "Tacos", "Taxes", "Teachers", "Telephones", "Television", "The 1960s", "The 1980s",
  "The Beach", "The Beatles", "The Big Bang", "The Circus", "The Dentist", "The Eiffel Tower", "The End of the World", "The Force",
  "The Grand Canyon", "The Great Wall of China", "The Grinch", "The Internet", "The Mall", "The Moon", "The Ocean", "The Police",
  "The Pyramids", "The Renaissance", "The Rocky Mountains", "The Simpsons", "The Titanic", "The Tooth Fairy", "The White House",
  "Thunder", "Tigers", "Time Travel", "Toads", "Toenails", "Toilets", "Tomatoes", "Tornadoes", "Toys", "Trains", "Trees", "Trolls",
  "Trucks", "Turtles", "Vampires", "Video Games", "Vikings", "Volcanoes", "Vultures", "Waffles", "Walt Disney", "Washington D.C.",
  "Whales", "Winnie the Pooh", "This Morning", "Wizards", "Worms", "Yellowstone Park", "Yoda",

  "A Coffee Spill", "A Cracked Screen", "A Fake Smile", "A Forgotten Birthday", "A Lost Remote", "A Random Text from Your Ex",
  "A Silent Elevator Ride", "A Zombie Apocalypse", "An Empty Fridge", "An Overpriced Coffee", "Apple Watch Tan Line",
  "Awkward Family Photos", "Bluetooth Headphones", "Broken Promises", "Car Alarms", "Cereal at Midnight", "Creepy Dolls",
  "Dad Sneakers", "Deep-Fried Oreos", "Fidget Spinners", "Forgotten Passwords", "Gas Station Hot Dogs", "Getting Ghosted",
  "Group Chats", "Ice Bath", "Inflatable Pool", "Kombucha", "Leftovers", "Lost Wi-Fi Signal", "Midnight Snacks", "Nerf Guns",
  "Overdue Library Books", "Pickle Jars", "Plastic Straws", "Power Outages", "Pumpkin Spice Everything", "Reality TV Shows",
  "Ripped Jeans", "Robot Vacuums", "Rollerblades", "Selfies", "Sneezing Pandas", "Spoilers", "Sticky Notes", "Streaming Subscriptions",
  "Sunburns", "Surge Protectors", "Tangled Headphones", "The Cloud", "The Friend Zone", "The Group Project", "The Matrix",
  "Traffic Cones", "Unfinished Homework", "Virtual Reality", "Wet Dog Smell", "Wi-Fi", "Zoom Calls"
];

// Export a function to get new shuffled decks
module.exports = {
  getNewDecks: () => ({
    greenDeck: shuffle([...greenCards]),
    redDeck: shuffle([...redCards])
  })
};


