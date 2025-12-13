#!/bin/bash
# Select 50 stickers for MVP and optimize them
# Created: 2025-12-12

SOURCE_DIR="/Users/KevinHG/DevKev/personal/ynab-organizer/assets/stickers-all/converted"
OUTPUT_DIR="/Users/KevinHG/DevKev/personal/ynab-organizer/web/public/stickers/selected"
PROJECT_DIR="/Users/KevinHG/DevKev/personal/ynab-organizer"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Selecting and optimizing 50 stickers for MVP..."
echo ""

# Define the 50 selected stickers by category
# Format: filename:category1,category2

STICKERS=(
    # === EATS - MEALS (8) ===
    "mf7_food-retro-cartoon-vol-01-surprised-pizza.svg:Meals,Eating Out"
    "mf7_food-retro-cartoon-vol-01-funny-sandwich.svg:Meals,Eating Out"
    "mf7_food-retro-cartoon-vol-01-lazy-noodle.svg:Meals,Eating Out"
    "mf7_food-retro-cartoon-vol-01-old-hotdog.svg:Meals,Eating Out"
    "mf16_food-retro-cartoon-vol-02-angry-sushi.svg:Meals,Eating Out"
    "mf16_food-retro-cartoon-vol-02-triangle-sandwich.svg:Meals,Eating Out"
    "mf16_food-retro-cartoon-vol-02-lazy-meat.svg:Meals,Groceries"
    "mf31_fast-food-vol-02-happy-kebab.svg:Meals,Eating Out"

    # === EATS - COFFEE/SNACKS (6) ===
    "mf7_food-retro-cartoon-vol-01-happy-doughnut.svg:Coffee / Snacks,Snacks"
    "mf16_food-retro-cartoon-vol-02-honey-pancake.svg:Coffee / Snacks,Breakfast"
    "mf16_food-retro-cartoon-vol-02-lazy-waffle.svg:Coffee / Snacks,Breakfast"
    "mf33_retro-cartoon-ice-cream-logo-badges-ice-cream-cone.svg:Coffee / Snacks,Treats"
    "mf33_retro-cartoon-ice-cream-logo-badges-popsicle.svg:Coffee / Snacks,Treats"
    "mf3_retro-logo-badges-coffee-shop.svg:Coffee / Snacks,Coffee"

    # === SHOPPING/ELECTRONICS (8) ===
    "mf4_shopping-character-vol-01-shopping-cart.svg:Groceries,Shopping"
    "mf4_shopping-character-vol-01-shopping-bag.svg:Clothing,Shopping"
    "mf4_shopping-character-vol-01-funny-box.svg:House :') / Electronics,Amazon"
    "mf4_shopping-character-vol-01-package-box.svg:House :') / Electronics,Shipping"
    "mf13_nerdy-things-cartoon-vol-3-floppy-disk.svg:Software Subscriptions,Tech"
    "mf13_nerdy-things-cartoon-vol-3-retro-phone.svg:House :') / Electronics,Phone"
    "mf13_nerdy-things-cartoon-vol-3-colorfull-mouse.svg:House :') / Electronics,Computer"
    "mf4_shopping-character-vol-01-angry-handphone.svg:House :') / Electronics,Phone"

    # === ENTERTAINMENT/FUN (6) ===
    "mf13_nerdy-things-cartoon-vol-3-tape-cassette.svg:Tickets / Travel / Fun,Music"
    "mf13_nerdy-things-cartoon-vol-3-music-plate.svg:Tickets / Travel / Fun,Music"
    "mf11_nerdy-things-cartoon-character-vol-1-cute-game-watch.svg:Tickets / Travel / Fun,Games"
    "mf11_nerdy-things-cartoon-character-vol-1-uno-cards.svg:Tickets / Travel / Fun,Games"
    "mf15_retro-cartoon-music-world-logo-badges.svg:Tickets / Travel / Fun,Entertainment"
    "mf13_nerdy-things-cartoon-vol-3-roll-film.svg:Tickets / Travel / Fun,Movies"

    # === SPORTS/FITNESS (6) ===
    "mf14_retro-cartoon-sport-logo-badges-running-club.svg:Gym / Fitness,Running"
    "mf14_retro-cartoon-sport-logo-badges-basketball.svg:Gym / Fitness,Sports"
    "mf2_sports-character-cartoon-vol-01-happy-basketball.svg:Gym / Fitness,Sports"
    "mf30_sports-character-cartoon-vol-03-punch-glove.svg:Gym / Fitness,Boxing"
    "mf22_retro-cartoon-eco-friendly-logo-badges-cycling.svg:Gym / Fitness,Cycling"
    "mf30_sports-character-cartoon-vol-03-swim-glass.svg:Gym / Fitness,Swimming"

    # === TRAVEL/TRANSPORTATION (4) ===
    "mf3_retro-logo-badges-transport-&-travel.svg:Tickets / Travel / Fun,Travel"
    "mf22_retro-cartoon-eco-friendly-logo-badges-electronic-vehicle.svg:Transportation,Electric"
    "mf24_summer-cartoon-character-vol-01-flamingo.svg:Tickets / Travel / Fun,Vacation"
    "mf34_authentic-india-badge-vol-3-traditional-travel.svg:Tickets / Travel / Fun,Travel"

    # === GIFTS (3) ===
    "mf5_winter-character-badge-gift-box.svg:Gifts,Presents"
    "mf25_new-year-badge-vol-3-pinky-bow.svg:Gifts,Celebration"
    "mf25_new-year-badge-vol-3-cute-crown.svg:Treat yo self (and Ross),Celebration"

    # === HEALTH/GROOMING (4) ===
    "mf3_retro-logo-badges-health-care.svg:Medical,Health,Therapy"
    "mf24_summer-cartoon-character-vol-01-sunglasses.svg:Grooming / haircuts,Style"
    "mf32_spring-cartoon-character-happy-sweater.svg:Clothing,Fashion"
    "mf9_vintage-logo-badges-barbershop.svg:Grooming / haircuts,Haircut"

    # === SEASONAL/FALLBACKS (5) ===
    "mf20_autumn-character-badge-smiley-pumpkin.svg:Groceries,Seasonal"
    "mf24_summer-cartoon-character-vol-01-smile-watermelon.svg:Groceries,Fruit"
    "mf32_spring-cartoon-character-picnic-basket.svg:Meals,Outdoor"
    "mf22_retro-cartoon-eco-friendly-logo-badges-earth.svg:Donation,Environment"
    "mf32_spring-cartoon-character-curious-tomato.svg:Groceries,Produce"
)

# Copy and track
copied=0
failed=0

for entry in "${STICKERS[@]}"; do
    filename="${entry%%:*}"
    categories="${entry#*:}"

    src="$SOURCE_DIR/$filename"
    dst="$OUTPUT_DIR/$filename"

    if [ -f "$src" ]; then
        cp "$src" "$dst"
        ((copied++))
        echo "[$copied] $filename"
    else
        echo "MISSING: $filename"
        ((failed++))
    fi
done

echo ""
echo "================================"
echo "Copied: $copied"
echo "Missing: $failed"
echo "================================"

# Optimize with SVGO
echo ""
echo "Optimizing with SVGO..."
cd "$OUTPUT_DIR"
npx svgo *.svg --project-dir="$PROJECT_DIR" -o . 2>/dev/null

# Show before/after sizes
echo ""
echo "Size summary:"
du -sh "$OUTPUT_DIR"
